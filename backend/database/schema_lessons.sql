
-- =======================
-- lessons table
-- =======================
CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  goal TEXT NOT NULL,
  age_range TEXT,
  style TEXT,
  pace TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS Trigger as $$
BEGIN
  NEW.updated_at=NOW();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();