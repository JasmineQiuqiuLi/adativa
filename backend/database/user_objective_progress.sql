CREATE TABLE user_objective_progress (
    user_id BIGINT NOT NULL REFERENCES users(id),
    objective_id BIGINT NOT NULL REFERENCES objectives(id),

    status TEXT NOT NULL DEFAULT 'not_started',

    attempts INT DEFAULT 0,
    correct INT DEFAULT 0,

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY(user_id, objective_id)
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at=NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_objective_progress_updated_at
BEFORE UPDATE
ON user_objective_progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();