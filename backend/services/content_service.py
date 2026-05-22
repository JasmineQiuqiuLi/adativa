# backend/services/content_service.py


import os
import instructor
from anthropic import Anthropic
from pydantic import BaseModel
from typing import List
from models.schemas import BLOCK_REGISTRY, get_content_model, GenerationStrategy
from pydantic import ValidationError
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ─── Client setup ─────────────────────────────────────────────────────────────
_anthropic_client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# Instructor wrapper
_client = instructor.from_anthropic(_anthropic_client)

_SYSTEM_PROMPT = (
    "You are a curriculum designer generating structured lesson content blocks. "
    "Generate engaging, age-appropriate content tailored to the learner's profile. "
)

def generate_anthropic_content(prompt: str) -> str:
    message = _anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4000,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return message.content[0].text

def _mode_instruction(mode:str,weak_skills:list[str])->str:
    if mode=="initial":
        return (
            "Teach this objective from scratch."
            "Open with CharacterMessage, and RichContent, any other non-graded items, then add 1-2 graded items that practice those skills"
        )
    if mode=="advance":
        return (
            "The learner has already mastered this objective. "
            "Generate deeper content — challenge problems, edge cases, or extension activities "
             "that go beyond the basics."
        )
    # remedial
    skills_str = ", ".join(weak_skills) if weak_skills else "the objective skills"
    return (
          f"The learner struggled with: {skills_str}. "
          "Begin with non-graded items target only those weak areas, "
          "then generate 1-2 targeted exercises that directly practice them."
      )


def _build_user_prompt(
    mode: str,
    objective: dict,
    skills: list[str],
    age_range: str,
    style: str,
    pace: str,
    weak_skills: list[str],
    existing_headlines: list[str] | None,
) -> str:
    parts = [
        f"Learner profile: age {age_range}, learning style: {style}, pace: {pace}.",
        f"Objective: {objective['title']} — {objective['description']}",
        f"Skills covered: {', '.join(skills) if skills else 'none listed'}.",
        "For each objective, always include both non-graded items and at least one graded block (mcq, fill_blank, short_essay, match, order, multiple_answer, true_false, game)."
    ]

    if existing_headlines:
        parts.append(
            "Already shown to this learner — do NOT repeat: "
            + "; ".join(existing_headlines)
        )

    parts.append(_mode_instruction(mode, weak_skills))
    parts.append("Generate between 3 and 5 content blocks.")

    return "\n".join(parts)


# ─── Plan call (plan_execute strategy, call 1) ────────────────────────────────
class _TypePlan(BaseModel):
    chosen_types: List[str]
    rationale: str

def _plan_call(prompt: str, allowed_types: list[str]) -> list[str]:
    try:
        result = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            response_model=_TypePlan,
            system=[{
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{
                "role": "user",
                "content": (
                    f"Available block types: {allowed_types}\n\n"
                    f"{prompt}\n\n"
                    "Choose 3–5 block types from the list above that best suit this content. "
                    "Return chosen_types as a list of exact type name strings."
                ),
            }],
        )
        return [t for t in result.chosen_types if t in allowed_types]
    except ValidationError as e:
        logger.exception(
            "Instructor response failed schema validation"
        )

        raise RuntimeError(
            "AI generated malformed content"
        ) from e


# ─── Main generation function ─────────────────────────────────────────────────
def generate_objective_content(
    strategy: GenerationStrategy,
    mode: str,
    objective: dict,
    skills: list[str],
    age_range: str,
    style: str,
    pace: str,
    weak_skills: list[str] | None = None,
    allowed_types: list[str] | None = None,
    existing_headlines: list[str] | None = None,
) -> list[dict]:
    """
    Generate content blocks for one objective.

    Returns a list of dicts ready to be stored in content_blocks.data.

    strategy=SINGLE  : one instructor call, schema uses all allowed_types.
    strategy=PLAN_EXECUTE : call 1 picks 3-5 types, call 2 generates with
                            that narrowed schema.
    """
    all_types = allowed_types or list(BLOCK_REGISTRY.keys())

    prompt = _build_user_prompt(
        mode, objective, skills, age_range,
        style, pace, weak_skills, existing_headlines,
    )

    all_types = allowed_types or list(BLOCK_REGISTRY.keys())

    invalid = [
        t for t in all_types
        if t not in BLOCK_REGISTRY
    ]

    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid block types: {invalid}"
        )

    if strategy == GenerationStrategy.PLAN_EXECUTE:
        chosen_types = _plan_call(prompt, all_types)
        if not chosen_types:
            chosen_types = all_types  # fallback: plan call returned nothing valid
    else:
        chosen_types = all_types

    ContentModel = get_content_model(chosen_types)

    try:
        result = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            response_model=ContentModel,
            system=[{
                "type": "text",
                "text": _SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{
                "role": "user",
                "content": (
                    f"Block types to use for this call: {chosen_types}\n\n{prompt}"
                ),
            }],
        )
    except ValidationError as e:
        logger.exception(
            "Instructor response failed schema validation"
        )

        raise RuntimeError(
            "AI generated malformed content"
        ) from e

    return [block.model_dump() for block in result.blocks]