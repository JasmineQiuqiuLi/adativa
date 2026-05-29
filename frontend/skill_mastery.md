# Persist Per-Lesson Skill Mastery

## Summary
Persist skill mastery as **one row per learner, lesson, and skill**. For v1, every graded interaction on a content block updates all skills attached to that block’s objective through `objective_skill_map`. A skill becomes `mastered` when the learner has at least **3 graded attempts** for that skill in the lesson and accuracy is **>= 80%**.

## Table Shape
Add a new SQL schema file, for example `backend/database/user_lesson_skill_mastery.sql`:

```sql
CREATE TABLE user_lesson_skill_mastery (
    user_id BIGINT NOT NULL REFERENCES users(id),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    skill_id BIGINT NOT NULL REFERENCES skills(id),

    status TEXT NOT NULL DEFAULT 'not_started',

    attempts INT NOT NULL DEFAULT 0,
    correct INT NOT NULL DEFAULT 0,
    mastery_score NUMERIC NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, lesson_id, skill_id)
);

CREATE INDEX idx_user_lesson_skill_mastery_lesson
    ON user_lesson_skill_mastery (user_id, lesson_id);

CREATE TRIGGER trg_user_lesson_skill_mastery_updated_at
BEFORE UPDATE
ON user_lesson_skill_mastery
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

Status values:
`not_started`, `in_progress`, `mastered`.

## Key Changes
- Update skill mastery **inside the existing interaction write transaction**, immediately after inserting into `fact_interactions`.
- Count only graded attempts:
  - Include rows where `attempt_number > 0` or `submitted_at IS NOT NULL`.
  - Ignore engagement-only/non-graded rows.
- Resolve affected skills with:
  - `fact_interactions.content_id`
  - `content_blocks.objective_id`
  - `content_blocks.lesson_id`
  - `objective_skill_map.skill_id`
- For each affected skill, upsert:
  - `attempts += 1`
  - `correct += 1` only when `is_correct IS TRUE`
  - `mastery_score = correct / attempts`
  - `status = mastered` when `attempts >= 3 AND mastery_score >= 0.8`, otherwise `in_progress`
  - `started_at` on first attempt
  - `mastered_at` when first becoming mastered

## API / Read Path
Add a read endpoint for lesson skill mastery:

```http
GET /lessons/{lesson_id}/skills/mastery?user_id=123
```

Return one row per skill attached to the lesson’s objectives, including missing progress as `not_started`:

```ts
type SkillMastery = {
  skill_id: number;
  name: string;
  description: string | null;
  status: "not_started" | "in_progress" | "mastered";
  attempts: number;
  correct: number;
  mastery_score: number;
  started_at: string | null;
  mastered_at: string | null;
  updated_at: string | null;
};
```

Frontend can consume this later in `LessonNavigation`, but the first implementation should focus on backend persistence and read API.

## Test Plan
- Insert a graded incorrect attempt for an objective with 2 skills: both skill rows are created as `in_progress`, `attempts=1`, `correct=0`.
- Insert 3 attempts with 3 correct: skill rows become `mastered`, `mastery_score=1`.
- Insert 3 attempts with 2 correct: skill rows become `in_progress`, `mastery_score=0.666...`.
- Insert an engagement-only row: no skill mastery row changes.
- Repeated objectives sharing the same skill in one lesson aggregate into the same `(user_id, lesson_id, skill_id)` row.
- `GET /lessons/{lesson_id}/skills/mastery` returns all lesson skills, including `not_started` rows when no mastery row exists.

## Assumptions
- Mastery is **per lesson-skill**, not global across all lessons.
- v1 uses **objective-level skill attribution**, not `content_block_skills`.
- Objective completion does not automatically master skills; mastery comes from graded attempts.
