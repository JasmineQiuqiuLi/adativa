import json

from database.db import get_connection
from services.progress_service import update_progress_for_interaction
from services.skill_mastery_service import update_skill_mastery_for_interaction


def create_interaction(payload: dict) -> int:
    """Insert one row into fact_interactions. Returns the new id."""
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Merge ShortEssay-specific grading fields into metadata so the column
        # stays narrow. metadata is the catch-all for block-specific data.
        metadata = payload.get("metadata") or {}
        for k in ("graded_at", "grading_status", "grading_feedback"):
            v = payload.get(k)
            if v is not None:
                metadata[k] = v.isoformat() if hasattr(v, "isoformat") else v

        cur.execute(
            """
            INSERT INTO fact_interactions
                (user_id, session_id, engagement_id,
                 content_id, content_type,
                 interaction_type,
                 started_at, engagement_end, active_duration_ms,
                 submitted_at, response, is_correct, score, attempt_number,
                 metadata)
            VALUES
                (%s, %s, %s,
                 %s, %s,
                 %s,
                 %s, %s, %s,
                 %s, %s, %s, %s, %s,
                 %s::jsonb)
            RETURNING id;
            """,
            (
                payload["user_id"],
                payload["session_id"],
                payload["engagement_id"],
                payload["content_id"],
                payload["content_type"],
                payload["interaction_type"],
                payload["started_at"],
                payload.get("engagement_end"),
                payload.get("active_duration_ms", 0),
                payload.get("submitted_at"),
                payload.get("response"),
                payload.get("is_correct"),
                payload.get("score"),
                payload.get("attempt_number", 0),
                json.dumps(metadata) if metadata else None,
            ),
        )
        new_id = cur.fetchone()[0]
        update_progress_for_interaction(cur, payload)
        update_skill_mastery_for_interaction(cur, payload)
        conn.commit()
        return new_id

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def finalize_engagement(
    engagement_id: str,
    engagement_end,
    active_duration_ms: int,
) -> int:
    """PATCH every row sharing engagement_id with the final engagement fields.
    Returns the number of rows updated."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE fact_interactions
            SET engagement_end = %s,
                active_duration_ms = %s
            WHERE engagement_id = %s;
            """,
            (engagement_end, active_duration_ms, engagement_id),
        )
        updated = cur.rowcount
        conn.commit()
        return updated
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
