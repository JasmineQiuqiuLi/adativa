import json
import logging
import os
from collections.abc import Mapping
from typing import Any

import instructor
from anthropic import Anthropic
from pydantic import BaseModel


logger = logging.getLogger(__name__)

_anthropic_client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)
_client = instructor.from_anthropic(_anthropic_client)


class _SkillOption(BaseModel):
    skill_id: int
    name: str
    description: str | None = None


class _BlockSkillMapping(BaseModel):
    block_id: int
    skill_ids: list[int]


class _BlockSkillTaggingResponse(BaseModel):
    mappings: list[_BlockSkillMapping]


def tag_content_blocks_for_objective(
    cur,
    objective_id: int,
    blocks: list[Any],
    force: bool = False,
) -> dict[str, int]:
    """Populate content_block_skills for blocks from one objective.

    LLM tagging is best-effort. Every processed block with objective skills gets
    at least one mapping because empty/invalid tags fall back to all objective
    skills.
    """
    normalized_blocks = [_normalize_block(block) for block in blocks]
    normalized_blocks = [block for block in normalized_blocks if block["id"]]

    counts = {
        "tagged_blocks": 0,
        "skipped_blocks": 0,
        "fallback_blocks": 0,
        "failed_blocks": 0,
    }

    if not normalized_blocks:
        return counts

    skills = _fetch_objective_skills(cur, objective_id)
    if not skills:
        counts["skipped_blocks"] = len(normalized_blocks)
        return counts

    candidate_blocks = _filter_tag_candidates(
        cur=cur,
        blocks=normalized_blocks,
        force=force,
    )
    counts["skipped_blocks"] = len(normalized_blocks) - len(candidate_blocks)

    if not candidate_blocks:
        return counts

    if force:
        _delete_existing_tags(cur, [block["id"] for block in candidate_blocks])

    allowed_skill_ids = {skill.skill_id for skill in skills}
    fallback_skill_ids = sorted(allowed_skill_ids)

    llm_mappings = _tag_blocks_with_llm(candidate_blocks, skills)

    for block in candidate_blocks:
        raw_skill_ids = llm_mappings.get(block["id"], [])
        valid_skill_ids = [
            skill_id
            for skill_id in raw_skill_ids
            if skill_id in allowed_skill_ids
        ]

        if not valid_skill_ids:
            valid_skill_ids = fallback_skill_ids
            counts["fallback_blocks"] += 1

        _insert_block_skill_tags(
            cur=cur,
            block_id=block["id"],
            skill_ids=valid_skill_ids,
        )
        counts["tagged_blocks"] += 1

    return counts


def backfill_lesson_content_block_skills(
    cur,
    lesson_id: int,
    force: bool = False,
) -> dict[str, int]:
    cur.execute("""
        SELECT id, lesson_id, objective_id, generation_mode, strategy_used,
               type, title, data, order_index, status
        FROM content_blocks
        WHERE lesson_id = %s
        AND objective_id IS NOT NULL
        AND status = 'active'
        ORDER BY objective_id, order_index;
    """, (lesson_id,))

    blocks_by_objective: dict[int, list[dict[str, Any]]] = {}
    for row in cur.fetchall():
        objective_id = row[2]
        blocks_by_objective.setdefault(objective_id, []).append({
            "id": row[0],
            "lesson_id": row[1],
            "objective_id": row[2],
            "generation_mode": row[3],
            "strategy_used": row[4],
            "type": row[5],
            "title": row[6],
            "data": row[7],
            "order_index": row[8],
            "status": row[9],
        })

    totals = {
        "tagged_blocks": 0,
        "skipped_blocks": 0,
        "fallback_blocks": 0,
        "failed_blocks": 0,
    }

    for objective_id, blocks in blocks_by_objective.items():
        counts = tag_content_blocks_for_objective(
            cur=cur,
            objective_id=objective_id,
            blocks=blocks,
            force=force,
        )
        for key in totals:
            totals[key] += counts[key]

    return totals


def _fetch_objective_skills(cur, objective_id: int) -> list[_SkillOption]:
    cur.execute("""
        SELECT s.id, s.name, s.description
        FROM objective_skill_map osm
        JOIN skills s ON s.id = osm.skill_id
        WHERE osm.objective_id = %s
        ORDER BY s.name;
    """, (objective_id,))

    return [
        _SkillOption(skill_id=row[0], name=row[1], description=row[2])
        for row in cur.fetchall()
    ]


def _filter_tag_candidates(
    cur,
    blocks: list[dict[str, Any]],
    force: bool,
) -> list[dict[str, Any]]:
    if force:
        return blocks

    block_ids = [block["id"] for block in blocks]
    cur.execute("""
        SELECT DISTINCT block_id
        FROM content_block_skills
        WHERE block_id = ANY(%s);
    """, (block_ids,))
    tagged_block_ids = {row[0] for row in cur.fetchall()}

    return [
        block
        for block in blocks
        if block["id"] not in tagged_block_ids
    ]


def _delete_existing_tags(cur, block_ids: list[int]) -> None:
    if not block_ids:
        return

    cur.execute("""
        DELETE FROM content_block_skills
        WHERE block_id = ANY(%s);
    """, (block_ids,))


def _insert_block_skill_tags(
    cur,
    block_id: int,
    skill_ids: list[int],
) -> None:
    for skill_id in sorted(set(skill_ids)):
        cur.execute("""
            INSERT INTO content_block_skills (block_id, skill_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING;
        """, (block_id, skill_id))


def _tag_blocks_with_llm(
    blocks: list[dict[str, Any]],
    skills: list[_SkillOption],
) -> dict[int, list[int]]:
    try:
        result = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            response_model=_BlockSkillTaggingResponse,
            system=(
                "You tag learning content blocks with the exact skills they "
                "practice. Use only the provided skill_id values."
            ),
            messages=[{
                "role": "user",
                "content": json.dumps({
                    "allowed_skills": [
                        skill.model_dump()
                        for skill in skills
                    ],
                    "blocks": [
                        _build_block_payload(block)
                        for block in blocks
                    ],
                    "instructions": (
                        "Return one mapping for every block_id. skill_ids must "
                        "come from allowed_skills. Choose one or more skills "
                        "that the block directly teaches, practices, or assesses."
                    ),
                }),
            }],
        )
    except Exception:
        logger.exception(
            "Failed to tag content blocks with skills; falling back to all objective skills"
        )
        return {}

    return {
        mapping.block_id: mapping.skill_ids
        for mapping in result.mappings
    }


def _build_block_payload(block: dict[str, Any]) -> dict[str, Any]:
    data = block.get("data") or {}

    return {
        "block_id": block["id"],
        "type": block.get("type"),
        "title": block.get("title") or data.get("title") or data.get("headline"),
        "text": _extract_relevant_text(data),
    }


def _normalize_block(block: Any) -> dict[str, Any]:
    if hasattr(block, "model_dump"):
        block = block.model_dump()
    elif not isinstance(block, Mapping):
        block = dict(block)

    return {
        "id": block.get("id"),
        "lesson_id": block.get("lesson_id"),
        "objective_id": block.get("objective_id"),
        "generation_mode": block.get("generation_mode"),
        "strategy_used": block.get("strategy_used"),
        "type": block.get("type"),
        "title": block.get("title"),
        "data": block.get("data") or {},
        "order_index": block.get("order_index"),
        "status": block.get("status"),
    }


def _extract_relevant_text(value: Any, limit: int = 1800) -> str:
    pieces: list[str] = []

    def visit(node: Any, key: str | None = None) -> None:
        if len(" ".join(pieces)) >= limit:
            return

        if isinstance(node, str):
            text = node.strip()
            if text:
                pieces.append(f"{key}: {text}" if key else text)
            return

        if isinstance(node, list):
            for item in node:
                visit(item, key)
            return

        if isinstance(node, dict):
            priority_keys = (
                "question",
                "headline",
                "body",
                "prompt",
                "revealed_content",
                "scenario",
                "description",
                "content",
                "explanation",
                "rubric_hint",
                "items",
                "options",
                "pairs",
                "steps",
                "tabs",
                "cards",
                "nodes",
            )
            for child_key in priority_keys:
                if child_key in node:
                    visit(node[child_key], child_key)
            return

    visit(value)
    return " ".join(pieces)[:limit]
