from database.db import get_connection


TERMINAL_STATUSES = ("completed", "mastered")


def get_lesson_progress(
    user_id: int,
    lesson_id: int
) -> dict:

    conn = get_connection()

    try:
        cur = conn.cursor()

        rows = _fetch_progress_rows(
            cur,
            user_id,
            lesson_id
        )

        ACTIVE_STATUSES = (
            'in_progress',
            'not_started'
        )

        # NULL status (no progress row yet) counts as still-active.
        current_objective_id = next(
            (r[0] for r in rows if r[2] is None or r[2] in ACTIVE_STATUSES),
            None
        )

        return {
            "current_objective_id":
                current_objective_id,

            "objectives": [
                {
                    "objective_id": r[0],
                    "order_index":  r[1],
                    "status":       r[2] or "not_started",
                    "attempts":     r[3] or 0,
                    "correct":      r[4] or 0,
                    "started_at":   r[5],
                    "completed_at": r[6],
                    "updated_at":   r[7],
                }
                for r in rows
            ]
        }

    finally:
        cur.close()
        conn.close()


def _fetch_progress_rows(cur, user_id: int, lesson_id: int):
    cur.execute("""
        SELECT o.id, o.order_index, p.status,
                p.attempts, p.correct,
                p.started_at, p.completed_at, p.updated_at
        FROM objectives o
        LEFT JOIN user_objective_progress p
        ON p.objective_id = o.id
        AND p.user_id = %s
        WHERE o.lesson_id = %s
        ORDER BY o.order_index;
    """, (user_id,lesson_id))
    return cur.fetchall()


def update_objective_progress(
    user_id: int,
    lesson_id: int,
    objective_id: int,
    status: str | None = None,
    attempts_delta: int = 0,
    correct_delta: int = 0,
) -> dict:
    conn = get_connection()

    try:
        cur = conn.cursor()

        cur.execute("""
            SELECT id
            FROM objectives
            WHERE id = %s
            AND lesson_id = %s
            AND status = 'active';
        """, (objective_id, lesson_id))
        if not cur.fetchone():
            raise ValueError("Objective not found for lesson")

        _upsert_progress(
            cur=cur,
            user_id=user_id,
            objective_id=objective_id,
            status=status,
            attempts_delta=attempts_delta,
            correct_delta=correct_delta,
        )

        conn.commit()
        return get_lesson_progress(user_id=user_id, lesson_id=lesson_id)

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def update_progress_for_interaction(cur, payload: dict) -> None:
    cur.execute("""
        SELECT objective_id
        FROM content_blocks
        WHERE id = %s
        AND objective_id IS NOT NULL;
    """, (payload["content_id"],))
    row = cur.fetchone()
    if not row:
        return

    is_attempt = (
        payload.get("attempt_number", 0) > 0
        or payload.get("submitted_at") is not None
    )

    _upsert_progress(
        cur=cur,
        user_id=payload["user_id"],
        objective_id=row[0],
        status="in_progress",
        attempts_delta=1 if is_attempt else 0,
        correct_delta=1 if is_attempt and payload.get("is_correct") is True else 0,
    )


def _upsert_progress(
    cur,
    user_id: int,
    objective_id: int,
    status: str | None,
    attempts_delta: int,
    correct_delta: int,
) -> None:
    cur.execute("""
        INSERT INTO user_objective_progress
            (user_id, objective_id, status, attempts, correct, started_at, completed_at)
        VALUES (
            %s,
            %s,
            COALESCE(%s, 'in_progress'),
            %s,
            %s,
            CASE
                WHEN COALESCE(%s, 'in_progress') <> 'not_started'
                THEN NOW()
                ELSE NULL
            END,
            CASE
                WHEN COALESCE(%s, '') IN ('completed', 'mastered')
                THEN NOW()
                ELSE NULL
            END
        )
        ON CONFLICT (user_id, objective_id)
        DO UPDATE SET
            status = CASE
                WHEN user_objective_progress.status = 'mastered' THEN 'mastered'
                WHEN EXCLUDED.status = 'not_started' THEN user_objective_progress.status
                WHEN user_objective_progress.status IN ('completed', 'mastered')
                    AND EXCLUDED.status = 'in_progress'
                    THEN user_objective_progress.status
                ELSE EXCLUDED.status
            END,
            attempts = user_objective_progress.attempts + EXCLUDED.attempts,
            correct = user_objective_progress.correct + EXCLUDED.correct,
            started_at = COALESCE(user_objective_progress.started_at, EXCLUDED.started_at, NOW()),
            completed_at = CASE
                WHEN EXCLUDED.status IN ('completed', 'mastered')
                    THEN COALESCE(user_objective_progress.completed_at, NOW())
                ELSE user_objective_progress.completed_at
            END;
    """, (
        user_id,
        objective_id,
        status,
        attempts_delta,
        correct_delta,
        status,
        status,
    ))
