CREATE TABLE content_blocks (
    id               SERIAL PRIMARY KEY,
    lesson_id        INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    objective_id     INTEGER REFERENCES objectives(id) ON DELETE CASCADE,
    generation_mode  TEXT NOT NULL DEFAULT 'initial',
    strategy_used    TEXT NOT NULL DEFAULT 'plan_execute',
    type             TEXT NOT NULL,
    title            TEXT,
    data             JSONB NOT NULL,
    order_index      INTEGER NOT NULL,
    status           TEXT NOT NULL DEFAULT 'active',
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_content_blocks_lookup
    ON content_blocks(lesson_id, objective_id, generation_mode);

  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER trg_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();