from database.db import get_connection


READY_STATUSES = ("proficient", "mastered")


def get_objective_progression(
    user_id: int,
    lesson_id: int,
    objective_id: int,
) -> dict:
    conn = get_connection()
    try:
        cur = conn.cursor()

        objective = _fetch_objective(cur, lesson_id, objective_id)
        if not objective:
            raise ValueError("Objective not found for lesson")

        skill_rows = _fetch_objective_skill_mastery(
            cur=cur,
            user_id=user_id,
            lesson_id=lesson_id,
            objective_id=objective_id,
        )
        has_next = _has_next_objective(
            cur=cur,
            lesson_id=lesson_id,
            order_index=objective["order_index"],
        )

        recommended_action, reason, weak_skills = _recommend_action(skill_rows)

        return {
            "recommended_action": recommended_action,
            "reason": reason,
            "weak_skills": weak_skills,
            "options": _build_options(
                recommended_action=recommended_action,
                has_next=has_next,
            ),
        }
    finally:
        cur.close()
        conn.close()


def _fetch_objective(cur, lesson_id: int, objective_id: int) -> dict | None:
    cur.execute("""
        SELECT id, order_index, title
        FROM objectives
        WHERE id = %s
        AND lesson_id = %s
        AND status = 'active';
    """, (objective_id, lesson_id))
    row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "order_index": row[1],
        "title": row[2],
    }


def _fetch_objective_skill_mastery(
    cur,
    user_id: int,
    lesson_id: int,
    objective_id: int,
) -> list[dict]:
    cur.execute("""
        SELECT
            s.id,
            s.name,
            COALESCE(m.status, 'not_started') AS status,
            COALESCE(m.evidence_count, 0) AS evidence_count,
            COALESCE(m.correct_evidence_count, 0) AS correct_evidence_count,
            COALESCE(m.mastery_score, 0) AS mastery_score
        FROM objective_skill_map osm
        JOIN skills s ON s.id = osm.skill_id
        LEFT JOIN user_lesson_skill_mastery m
            ON m.skill_id = s.id
            AND m.lesson_id = %s
            AND m.user_id = %s
        WHERE osm.objective_id = %s
        ORDER BY s.name;
    """, (lesson_id, user_id, objective_id))

    return [
        {
            "skill_id": row[0],
            "name": row[1],
            "status": row[2],
            "evidence_count": row[3],
            "correct_evidence_count": row[4],
            "mastery_score": float(row[5] or 0),
        }
        for row in cur.fetchall()
    ]


def _has_next_objective(cur, lesson_id: int, order_index: int) -> bool:
    cur.execute("""
        SELECT 1
        FROM objectives
        WHERE lesson_id = %s
        AND status = 'active'
        AND order_index > %s
        LIMIT 1;
    """, (lesson_id, order_index))
    return cur.fetchone() is not None


def _recommend_action(skill_rows: list[dict]) -> tuple[str, str, list[str]]:
    if not skill_rows:
        return (
            "next",
            "No skills are mapped to this objective, so moving forward is recommended.",
            [],
        )

    weak_skill_rows = [
        skill
        for skill in skill_rows
        if skill["status"] not in READY_STATUSES
    ]

    if weak_skill_rows:
        weak_skill_names = [skill["name"] for skill in weak_skill_rows]
        no_evidence = all(skill["evidence_count"] == 0 for skill in skill_rows)
        if no_evidence:
            return (
                "remedial",
                "There is not enough skill evidence yet. Practice this objective before moving on.",
                weak_skill_names,
            )
        return (
            "remedial",
            "Some skills still need more practice before this objective is ready to complete.",
            weak_skill_names,
        )

    return (
        "next",
        "All skills for this objective are at least proficient. Moving forward is recommended.",
        [],
    )


def _build_options(recommended_action: str, has_next: bool) -> list[dict]:
    next_label = "Move to next objective" if has_next else "Complete lesson"

    options = [
        {
            "action": "remedial",
            "label": "Practice weak skills",
            "description": "Review targeted support for skills that need more evidence.",
            "enabled": True,
            "recommended": recommended_action == "remedial",
        },
        {
            "action": "advance",
            "label": "Try a challenge",
            "description": "Explore a harder extension for this objective.",
            "enabled": True,
            "recommended": recommended_action == "advance",
        },
        {
            "action": "next",
            "label": next_label,
            "description": "Finish this objective and continue through the lesson.",
            "enabled": True,
            "recommended": recommended_action == "next",
        },
    ]

    return options
