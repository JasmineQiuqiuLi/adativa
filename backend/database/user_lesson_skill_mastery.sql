CREATE TABLE IF NOT EXISTS user_lesson_skill_evidence (
    user_id BIGINT NOT NULL REFERENCES users(id),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    skill_id BIGINT NOT NULL REFERENCES skills(id),
    content_block_id BIGINT NOT NULL REFERENCES content_blocks(id),

    attempts_count INT NOT NULL DEFAULT 0,
    correct_attempts_count INT NOT NULL DEFAULT 0,
    has_correct_evidence BOOLEAN NOT NULL DEFAULT FALSE,

    first_attempted_at TIMESTAMPTZ,
    first_correct_at TIMESTAMPTZ,
    last_attempted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, lesson_id, skill_id, content_block_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_skill_evidence_skill
    ON user_lesson_skill_evidence (user_id, lesson_id, skill_id);

CREATE TABLE IF NOT EXISTS user_lesson_skill_mastery (
    user_id BIGINT NOT NULL REFERENCES users(id),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    skill_id BIGINT NOT NULL REFERENCES skills(id),

    status TEXT NOT NULL DEFAULT 'not_started',
    attempts_count INT NOT NULL DEFAULT 0,
    correct_attempts_count INT NOT NULL DEFAULT 0,
    evidence_count INT NOT NULL DEFAULT 0,
    correct_evidence_count INT NOT NULL DEFAULT 0,
    mastery_score NUMERIC NOT NULL DEFAULT 0,

    started_at TIMESTAMPTZ,
    proficient_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, lesson_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_skill_mastery_lesson
    ON user_lesson_skill_mastery (user_id, lesson_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at=NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_lesson_skill_evidence_updated_at
ON user_lesson_skill_evidence;

CREATE TRIGGER trg_user_lesson_skill_evidence_updated_at
BEFORE UPDATE
ON user_lesson_skill_evidence
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_lesson_skill_mastery_updated_at
ON user_lesson_skill_mastery;

CREATE TRIGGER trg_user_lesson_skill_mastery_updated_at
BEFORE UPDATE
ON user_lesson_skill_mastery
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
