-- =========================
-- 2. OBJECTIVES TABLE
-- =========================

CREATE TABLE IF NOT EXISTS objectives (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT NOT NULL,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_lesson
    FOREIGN KEY (lesson_id)
    REFERENCES lessons(id)
    ON DELETE CASCADE
);

-- Trigger (Trigger function is defined at another script)

CREATE TRIGGER update_objectives_updated_at
BEFORE UPDATE ON objectives
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
