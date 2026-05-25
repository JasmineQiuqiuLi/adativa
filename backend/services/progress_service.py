from database.db import get_connection

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