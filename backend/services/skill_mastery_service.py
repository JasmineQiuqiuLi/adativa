from __future__ import annotations

from datetime import datetime
from decimal import Decimal


MASTERY_EVIDENCE_THRESHOLD = 3
MASTERY_SCORE_THRESHOLD = Decimal("0.8")


def update_skill_mastery_for_interaction(cur, payload: dict) -> int:
    if not _is_graded_attempt(payload):
        return 0

    content_context = _fetch_content_context(cur, payload["content_id"])
    if not content_context:
        return 0

    lesson_id, objective_id = content_context
    skill_ids = _resolve_skill_ids(
        cur=cur,
        content_id=payload["content_id"],
        objective_id=objective_id,
    )
    if not skill_ids:
        return 0

    attempted_at = (
        payload.get("submitted_at")
        or payload.get("started_at")
        or datetime.utcnow()
    )
    is_correct = payload.get("is_correct") is True

    for skill_id in skill_ids:
        _upsert_skill_evidence(
            cur=cur,
            user_id=payload["user_id"],
            lesson_id=lesson_id,
            skill_id=skill_id,
            content_block_id=payload["content_id"],
            attempted_at=attempted_at,
            is_correct=is_correct,
        )
        _recompute_skill_mastery(
            cur=cur,
            user_id=payload["user_id"],
            lesson_id=lesson_id,
            skill_id=skill_id,
        )

    return len(skill_ids)


def get_lesson_skill_mastery(user_id: int, lesson_id: int) -> dict:
    from database.db import get_connection

    conn = get_connection()
    try:
        cur = conn.cursor()
        return _get_lesson_skill_mastery_with_cursor(
            cur=cur,
            user_id=user_id,
            lesson_id=lesson_id,
        )
    finally:
        cur.close()
        conn.close()


def backfill_lesson_skill_mastery(
    user_id: int,
    lesson_id: int,
    force: bool = False,
) -> dict:
    from database.db import get_connection

    conn = get_connection()
    try:
        cur = conn.cursor()

        if force:
            _delete_skill_mastery_rows(
                cur=cur,
                user_id=user_id,
                lesson_id=lesson_id,
            )

        rows = _fetch_historical_interactions(
            cur=cur,
            user_id=user_id,
            lesson_id=lesson_id,
        )

        evidence_snapshots: dict[tuple[int, int, int, int], dict] = {}
        updated_skill_keys: set[tuple[int, int, int]] = set()
        for row in rows:
            content_id = row[1]
            attempted_at = row[3] or row[2]
            is_correct = row[4] is True
            objective_id = row[6]
            skill_ids = _resolve_skill_ids(
                cur=cur,
                content_id=content_id,
                objective_id=objective_id,
            )

            for skill_id in skill_ids:
                key = (user_id, lesson_id, skill_id, content_id)
                snapshot = evidence_snapshots.setdefault(
                    key,
                    {
                        "attempts_count": 0,
                        "correct_attempts_count": 0,
                        "has_correct_evidence": False,
                        "first_attempted_at": attempted_at,
                        "first_correct_at": None,
                        "last_attempted_at": attempted_at,
                    },
                )
                snapshot["attempts_count"] += 1
                if is_correct:
                    snapshot["correct_attempts_count"] += 1
                    snapshot["has_correct_evidence"] = True
                    snapshot["first_correct_at"] = (
                        snapshot["first_correct_at"] or attempted_at
                    )
                if attempted_at and snapshot["first_attempted_at"]:
                    snapshot["first_attempted_at"] = min(
                        snapshot["first_attempted_at"],
                        attempted_at,
                    )
                    snapshot["last_attempted_at"] = max(
                        snapshot["last_attempted_at"],
                        attempted_at,
                    )
                updated_skill_keys.add((user_id, lesson_id, skill_id))

        for key, snapshot in evidence_snapshots.items():
            _, _, skill_id, content_block_id = key
            _upsert_skill_evidence_snapshot(
                cur=cur,
                user_id=user_id,
                lesson_id=lesson_id,
                skill_id=skill_id,
                content_block_id=content_block_id,
                snapshot=snapshot,
            )

        for _, _, skill_id in updated_skill_keys:
            _recompute_skill_mastery(
                cur=cur,
                user_id=user_id,
                lesson_id=lesson_id,
                skill_id=skill_id,
            )

        conn.commit()
        return {
            "lesson_id": lesson_id,
            "user_id": user_id,
            "processed_interactions": len(rows),
            "updated_skills": len(updated_skill_keys),
        }

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def _is_graded_attempt(payload: dict) -> bool:
    return (
        payload.get("attempt_number", 0) > 0
        or payload.get("submitted_at") is not None
    )


def _fetch_content_context(cur, content_id: int) -> tuple[int, int] | None:
    cur.execute("""
        SELECT lesson_id, objective_id
        FROM content_blocks
        WHERE id = %s
        AND objective_id IS NOT NULL;
    """, (content_id,))
    row = cur.fetchone()
    if not row:
        return None
    return row[0], row[1]


def _resolve_skill_ids(
    cur,
    content_id: int,
    objective_id: int,
) -> list[int]:
    cur.execute("""
        SELECT skill_id
        FROM content_block_skills
        WHERE block_id = %s
        ORDER BY skill_id;
    """, (content_id,))
    block_skill_ids = [row[0] for row in cur.fetchall()]
    if block_skill_ids:
        return block_skill_ids

    cur.execute("""
        SELECT skill_id
        FROM objective_skill_map
        WHERE objective_id = %s
        ORDER BY skill_id;
    """, (objective_id,))
    return [row[0] for row in cur.fetchall()]


def _upsert_skill_evidence(
    cur,
    user_id: int,
    lesson_id: int,
    skill_id: int,
    content_block_id: int,
    attempted_at,
    is_correct: bool,
) -> None:
    cur.execute("""
        INSERT INTO user_lesson_skill_evidence
            (user_id, lesson_id, skill_id, content_block_id,
             attempts_count, correct_attempts_count, has_correct_evidence,
             first_attempted_at, first_correct_at, last_attempted_at)
        VALUES
            (%s, %s, %s, %s,
             1, %s, %s,
             %s, %s, %s)
        ON CONFLICT (user_id, lesson_id, skill_id, content_block_id)
        DO UPDATE SET
            attempts_count = user_lesson_skill_evidence.attempts_count + 1,
            correct_attempts_count =
                user_lesson_skill_evidence.correct_attempts_count
                + EXCLUDED.correct_attempts_count,
            has_correct_evidence =
                user_lesson_skill_evidence.has_correct_evidence
                OR EXCLUDED.has_correct_evidence,
            first_attempted_at = COALESCE(
                user_lesson_skill_evidence.first_attempted_at,
                EXCLUDED.first_attempted_at
            ),
            first_correct_at = CASE
                WHEN EXCLUDED.has_correct_evidence
                THEN COALESCE(
                    user_lesson_skill_evidence.first_correct_at,
                    EXCLUDED.first_correct_at
                )
                ELSE user_lesson_skill_evidence.first_correct_at
            END,
            last_attempted_at = GREATEST(
                COALESCE(user_lesson_skill_evidence.last_attempted_at, EXCLUDED.last_attempted_at),
                EXCLUDED.last_attempted_at
            );
    """, (
        user_id,
        lesson_id,
        skill_id,
        content_block_id,
        1 if is_correct else 0,
        is_correct,
        attempted_at,
        attempted_at if is_correct else None,
        attempted_at,
    ))


def _upsert_skill_evidence_snapshot(
    cur,
    user_id: int,
    lesson_id: int,
    skill_id: int,
    content_block_id: int,
    snapshot: dict,
) -> None:
    cur.execute("""
        INSERT INTO user_lesson_skill_evidence
            (user_id, lesson_id, skill_id, content_block_id,
             attempts_count, correct_attempts_count, has_correct_evidence,
             first_attempted_at, first_correct_at, last_attempted_at)
        VALUES
            (%s, %s, %s, %s,
             %s, %s, %s,
             %s, %s, %s)
        ON CONFLICT (user_id, lesson_id, skill_id, content_block_id)
        DO UPDATE SET
            attempts_count = EXCLUDED.attempts_count,
            correct_attempts_count = EXCLUDED.correct_attempts_count,
            has_correct_evidence = EXCLUDED.has_correct_evidence,
            first_attempted_at = EXCLUDED.first_attempted_at,
            first_correct_at = EXCLUDED.first_correct_at,
            last_attempted_at = EXCLUDED.last_attempted_at;
    """, (
        user_id,
        lesson_id,
        skill_id,
        content_block_id,
        snapshot["attempts_count"],
        snapshot["correct_attempts_count"],
        snapshot["has_correct_evidence"],
        snapshot["first_attempted_at"],
        snapshot["first_correct_at"],
        snapshot["last_attempted_at"],
    ))


def _recompute_skill_mastery(
    cur,
    user_id: int,
    lesson_id: int,
    skill_id: int,
) -> None:
    cur.execute("""
        SELECT
            COALESCE(SUM(attempts_count), 0),
            COALESCE(SUM(correct_attempts_count), 0),
            COUNT(*),
            COALESCE(SUM(CASE WHEN has_correct_evidence THEN 1 ELSE 0 END), 0),
            MIN(first_attempted_at)
        FROM user_lesson_skill_evidence
        WHERE user_id = %s
        AND lesson_id = %s
        AND skill_id = %s;
    """, (user_id, lesson_id, skill_id))

    attempts_count, correct_attempts_count, evidence_count, correct_evidence_count, started_at = cur.fetchone()

    mastery_score = (
        Decimal(correct_evidence_count) / Decimal(evidence_count)
        if evidence_count
        else Decimal("0")
    )
    next_status = _derive_status(
        evidence_count=evidence_count,
        correct_evidence_count=correct_evidence_count,
        mastery_score=mastery_score,
    )

    cur.execute("""
        INSERT INTO user_lesson_skill_mastery
            (user_id, lesson_id, skill_id, status,
             attempts_count, correct_attempts_count,
             evidence_count, correct_evidence_count, mastery_score,
             started_at, proficient_at, mastered_at)
        VALUES
            (%s, %s, %s, %s,
             %s, %s,
             %s, %s, %s,
             %s,
             CASE WHEN %s IN ('proficient', 'mastered') THEN NOW() ELSE NULL END,
             CASE WHEN %s = 'mastered' THEN NOW() ELSE NULL END)
        ON CONFLICT (user_id, lesson_id, skill_id)
        DO UPDATE SET
            status = CASE
                WHEN user_lesson_skill_mastery.status = 'mastered'
                THEN 'mastered'
                ELSE EXCLUDED.status
            END,
            attempts_count = EXCLUDED.attempts_count,
            correct_attempts_count = EXCLUDED.correct_attempts_count,
            evidence_count = EXCLUDED.evidence_count,
            correct_evidence_count = EXCLUDED.correct_evidence_count,
            mastery_score = EXCLUDED.mastery_score,
            started_at = COALESCE(
                user_lesson_skill_mastery.started_at,
                EXCLUDED.started_at
            ),
            proficient_at = CASE
                WHEN EXCLUDED.status IN ('proficient', 'mastered')
                THEN COALESCE(
                    user_lesson_skill_mastery.proficient_at,
                    EXCLUDED.proficient_at,
                    NOW()
                )
                ELSE user_lesson_skill_mastery.proficient_at
            END,
            mastered_at = CASE
                WHEN user_lesson_skill_mastery.status = 'mastered'
                THEN user_lesson_skill_mastery.mastered_at
                WHEN EXCLUDED.status = 'mastered'
                THEN COALESCE(
                    user_lesson_skill_mastery.mastered_at,
                    EXCLUDED.mastered_at,
                    NOW()
                )
                ELSE user_lesson_skill_mastery.mastered_at
            END;
    """, (
        user_id,
        lesson_id,
        skill_id,
        next_status,
        attempts_count,
        correct_attempts_count,
        evidence_count,
        correct_evidence_count,
        mastery_score,
        started_at,
        next_status,
        next_status,
    ))


def _derive_status(
    evidence_count: int,
    correct_evidence_count: int,
    mastery_score: Decimal,
) -> str:
    if evidence_count == 0:
        return "not_started"
    if correct_evidence_count == 0:
        return "in_progress"
    if (
        evidence_count >= MASTERY_EVIDENCE_THRESHOLD
        and mastery_score >= MASTERY_SCORE_THRESHOLD
    ):
        return "mastered"
    return "proficient"


def _get_lesson_skill_mastery_with_cursor(
    cur,
    user_id: int,
    lesson_id: int,
) -> dict:
    cur.execute("""
        SELECT DISTINCT
            s.id,
            s.name,
            s.description,
            m.status,
            m.attempts_count,
            m.correct_attempts_count,
            m.evidence_count,
            m.correct_evidence_count,
            m.mastery_score,
            m.started_at,
            m.proficient_at,
            m.mastered_at,
            m.updated_at
        FROM objectives o
        JOIN objective_skill_map osm ON osm.objective_id = o.id
        JOIN skills s ON s.id = osm.skill_id
        LEFT JOIN user_lesson_skill_mastery m
            ON m.skill_id = s.id
            AND m.lesson_id = o.lesson_id
            AND m.user_id = %s
        WHERE o.lesson_id = %s
        AND o.status = 'active'
        ORDER BY s.name;
    """, (user_id, lesson_id))

    return {
        "lesson_id": lesson_id,
        "skills": [
            {
                "skill_id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3] or "not_started",
                "attempts_count": row[4] or 0,
                "correct_attempts_count": row[5] or 0,
                "evidence_count": row[6] or 0,
                "correct_evidence_count": row[7] or 0,
                "mastery_score": float(row[8] or 0),
                "started_at": row[9],
                "proficient_at": row[10],
                "mastered_at": row[11],
                "updated_at": row[12],
            }
            for row in cur.fetchall()
        ],
    }


def _delete_skill_mastery_rows(cur, user_id: int, lesson_id: int) -> None:
    cur.execute("""
        DELETE FROM user_lesson_skill_evidence
        WHERE user_id = %s
        AND lesson_id = %s;
    """, (user_id, lesson_id))

    cur.execute("""
        DELETE FROM user_lesson_skill_mastery
        WHERE user_id = %s
        AND lesson_id = %s;
    """, (user_id, lesson_id))


def _fetch_historical_interactions(
    cur,
    user_id: int,
    lesson_id: int,
) -> list[tuple]:
    cur.execute("""
        SELECT
            fi.user_id,
            fi.content_id,
            fi.started_at,
            fi.submitted_at,
            fi.is_correct,
            fi.attempt_number,
            cb.objective_id
        FROM fact_interactions fi
        JOIN content_blocks cb ON cb.id = fi.content_id
        WHERE fi.user_id = %s
        AND cb.lesson_id = %s
        AND cb.objective_id IS NOT NULL
        AND (
            fi.attempt_number > 0
            OR fi.submitted_at IS NOT NULL
        )
        ORDER BY COALESCE(fi.submitted_at, fi.started_at), fi.id;
    """, (user_id, lesson_id))
    return cur.fetchall()
