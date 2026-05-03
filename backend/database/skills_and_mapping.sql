--skills
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--mapping
CREATE TABLE IF NOT EXISTS objective_skill_map (
  id BIGSERIAL PRIMARY KEY,
  objective_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL,
  UNIQUE(objective_id,skill_id),
  FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);