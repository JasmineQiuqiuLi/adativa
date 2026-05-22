  CREATE TABLE content_block_skills (
    id        SERIAL PRIMARY KEY,
    block_id  INTEGER NOT NULL REFERENCES content_blocks(id) ON DELETE CASCADE,
    skill_id  INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(block_id, skill_id)
  );

  CREATE INDEX idx_cbs_skill ON content_block_skills(skill_id);
  CREATE INDEX idx_cbs_block ON content_block_skills(block_id);