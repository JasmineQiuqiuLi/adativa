CREATE TABLE fact_interactions (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL REFERENCES users(id),
    session_id UUID NOT NULL,
    engagement_id UUID NOT NULL,

    content_id BIGINT NOT NULL REFERENCES content_blocks(id),
    content_type TEXT NOT NULL,

    interaction_type TEXT NOT NULL,

    -- Engagement fields (set by EngagementWrapper, finalized on engagement_end)
    started_at TIMESTAMPTZ NOT NULL,
    engagement_end TIMESTAMPTZ,
    active_duration_ms INT NOT NULL DEFAULT 0,

    -- Attempt fields (graded blocks; nullable for non-graded engagement records)
    submitted_at TIMESTAMPTZ,
    response TEXT,
    is_correct BOOLEAN,
    score NUMERIC,
    attempt_number INT NOT NULL DEFAULT 0,

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PATCH /interactions/engagement/{engagement_id} updates every row sharing
-- the engagement_id at engagement_end time.
CREATE INDEX idx_fact_interactions_engagement_id
    ON fact_interactions (engagement_id);

CREATE INDEX idx_fact_interactions_user_content
    ON fact_interactions (user_id, content_id);

CREATE TRIGGER trg_fact_interactions_updated_at
BEFORE UPDATE
ON fact_interactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
