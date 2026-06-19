# Adativa Project Overview

Adativa is an AI-powered adaptive learning platform that turns a learner's goal into a personalized course. A user enters what they want to learn, the system generates objectives and measurable skills, then creates interactive lesson content one objective at a time. As the learner works through activities, Adativa tracks objective progress, skill mastery evidence, and recommends whether to practice weak skills, try a challenge, or move forward.

## What It Demonstrates

- Full-stack AI product development with React, FastAPI, PostgreSQL, and multiple LLM services.
- Structured content generation using typed schemas rather than free-form text blobs.
- Adaptive learning logic based on learner interactions, skill evidence, and objective progress.
- Interactive frontend rendering for mixed instructional and graded content blocks.
- Practical production-minded details: persistence, backfill endpoints, retry-safe mastery tracking, image validation, loading states, review navigation, and UI consistency.

## Core User Flow

1. A learner creates a lesson by entering a learning goal, age range, style, and pace.
2. The backend uses an LLM to generate a sequence of learning objectives.
3. The learner reviews or revises the objectives.
4. The backend generates measurable skills for each objective.
5. The learner starts the lesson. Content is generated objective by objective.
6. Generated content includes rich explanations, visual blocks, and graded checks.
7. Learner interactions are persisted to the backend.
8. Skill mastery is updated from distinct content-block evidence.
9. After the learner completes the graded checks on a page, the system recommends the next step:
   - practice weak skills,
   - try a challenge,
   - or move to the next objective.
10. When all objectives are complete, the learner sees a polished lesson completion screen.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Zustand |
| Backend | FastAPI, Python 3.12, Uvicorn |
| Database | PostgreSQL with JSONB content blocks |
| AI Generation | OpenAI for objective and skill generation; Anthropic with Instructor for typed content-block generation |
| Image Search | Tavily Search API for verified rich-content images |
| Auth | Email/password auth with bcrypt password hashing |
| Package Management | npm for frontend, uv/pyproject for backend |

## Major Features

### AI Lesson Planning

Adativa starts from a plain-language goal and generates a structured lesson plan. The lesson plan contains ordered objectives, each with a title and description. Learners can review and revise objectives before continuing.

### Skill Generation and Mapping

For each objective, the backend generates measurable skills and persists them in PostgreSQL. Skills are globally deduplicated, then linked to objectives through `objective_skill_map`.

### Typed Content Block Generation

Content is generated as a list of structured blocks, not as one long text response. The backend uses a registry of Pydantic block schemas, and the frontend uses a matching React renderer registry.

Supported block types include:

- Instructional: rich content, tabs, accordion, steps, scenario, character message, reveal, flash cards, diagram, video.
- Graded: multiple choice, multiple answer, true/false, fill blank, match, order, short essay, and interactive game.

### Rich Content Image Enrichment

LLM-generated image URLs are unreliable, so Adativa enriches rich-content image blocks with Tavily image search before saving content. The backend:

- builds a search query from the content, objective, and skills,
- retrieves image candidates from Tavily,
- validates candidate URLs with HTTP checks,
- replaces the generated image URL with a verified image,
- falls back to text-only layout if no working image is found.

The frontend also supports a lightbox so learners can click cropped rich-content images and view the full image.

### Content-Block Skill Tagging

After content blocks are generated and saved, the backend asks an LLM to tag each block with the objective skills it practices. These mappings are stored in `content_block_skills`.

If tagging fails or returns invalid skills, the system falls back to the objective's full skill list. This keeps content generation resilient while still allowing more precise mastery attribution when block-level tagging is available.

### Two-Table Skill Mastery Model

Skill mastery uses two tables:

- `user_lesson_skill_evidence`: one row per user, lesson, skill, and content block.
- `user_lesson_skill_mastery`: aggregate mastery state per user, lesson, and skill.

This design prevents retry inflation. Retrying the same question increases attempt counts but does not count as new evidence. Mastery is based on distinct content-block evidence, not repeated attempts on the same item.

Mastery statuses include:

- `not_started`
- `in_progress`
- `proficient`
- `mastered`

The system preserves `mastered` once reached, while still updating counts and scores.

### Objective Progression Recommendations

Instead of automatically sending learners to the next objective, Adativa provides a guided choice panel after the learner completes all graded checks on the current page.

The backend returns a deterministic recommendation based on current objective skill mastery:

- Recommend remedial practice when skills are weak or lack evidence.
- Recommend next objective when all skills are at least proficient.
- Keep advanced challenge available as optional depth.

The learner stays in control and can choose any available path.

### Reviewable Lesson Navigation

The left lesson navigation supports review mode. Learners can click objectives that already have generated content and load the saved content from the database without triggering new generation. Untouched future objectives stay locked so navigation clicks do not accidentally generate content.

### Interaction and Engagement Tracking

Graded and non-graded blocks emit interaction events. The backend persists attempts, skips, engagement sessions, correctness, score, and timing data in `fact_interactions`.

Graded blocks share consistent Submit, Skip, and Retry behavior:

- Submit records a graded attempt.
- Skip records the attempt as skipped and locks the current item.
- Retry starts a new attempt window where the block supports retries.

### Learning UX

The frontend includes several UX refinements:

- Dashboard-style course home with thumbnails.
- Calm blue visual theme and shared semantic color tokens.
- Friendly AI generation loading panels instead of plain loading text.
- Cleaner scroll behavior in the learning shell.
- Progression gate that unlocks recommendations only after graded checks are completed.
- Lesson completion page with a simple celebration animation.

## Backend Architecture

The backend is organized around FastAPI routes in `backend/main.py` and service modules in `backend/services/`.

Important services include:

- `lesson_service.py`: lesson creation, objective generation, skill generation, course listing.
- `content_service.py`: typed objective content generation.
- `content_skill_tagging_service.py`: post-generation block-to-skill tagging and backfill.
- `rich_content_image_service.py`: Tavily image enrichment and URL validation.
- `interaction_service.py`: interaction persistence.
- `skill_mastery_service.py`: evidence updates, mastery recomputation, read API, and backfill.
- `objective_progression_service.py`: deterministic next-step recommendations.
- `progress_service.py`: objective progress read and update logic.

Key backend endpoints include:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/lessons/create` | Create a lesson and generate objectives |
| `POST` | `/lessons/{lesson_id}/skills` | Generate and persist objective skills |
| `GET` | `/lessons/{lesson_id}/objectives-with-skills` | Return objectives, skills, and generated-content metadata |
| `POST` | `/lessons/{lesson_id}/objectives/{objective_id}/content` | Generate or return existing objective content |
| `GET` | `/lessons/{lesson_id}/objectives/{objective_id}/content` | Read existing generated content without generation |
| `POST` | `/interactions` | Persist learner interactions and update skill mastery |
| `GET` | `/lessons/{lesson_id}/skills/mastery` | Read lesson skill mastery for a user |
| `POST` | `/lessons/{lesson_id}/skills/mastery/backfill` | Rebuild mastery from historical interactions |
| `GET` | `/lessons/{lesson_id}/objectives/{objective_id}/progression` | Recommend remedial, advance, or next |

## Frontend Architecture

The frontend uses a feature-sliced structure under `frontend/src/features/`.

Main areas:

- `auth`: login, registration, persisted user state.
- `courses`: course home, lesson creation, objective review, skill review.
- `content`: reusable interactive block components and block renderer.
- `learning`: lesson player, progress API client, lesson navigation, progression panel.

The learning page separates:

- the current backend progress pointer,
- the selected objective being viewed,
- generated content mode (`initial`, `remedial`, `advance`),
- graded-block completion gating,
- and objective progression recommendations.

## Data Model Highlights

Important PostgreSQL tables include:

- `users`
- `lessons`
- `objectives`
- `skills`
- `objective_skill_map`
- `content_blocks`
- `content_block_skills`
- `fact_interactions`
- `user_objective_progress`
- `user_lesson_skill_evidence`
- `user_lesson_skill_mastery`

Content blocks are stored as JSONB, allowing the platform to support many block types while keeping a consistent table shape.

## Notable Engineering Decisions

- Typed block schemas reduce frontend/backend mismatch during AI content generation.
- Content generation stays resilient by falling back when image enrichment or skill tagging fails.
- Skill mastery separates attempts from evidence so repeated retries do not inflate mastery.
- Progression recommendations are deterministic for v1, making them easier to debug than a fully autonomous AI pilot.
- Navigation can review generated content without accidentally generating new future content.
- The UI uses a shared calm-blue theme with semantic status colors for consistency.

## Current Scope and Future Opportunities

Adativa currently supports end-to-end adaptive lesson generation, interaction tracking, skill mastery, and guided progression.

Future improvements could include:

- real-time streaming progress for long-running generation steps,
- teacher/admin analytics dashboards,
- more robust authentication and authorization,
- richer remediation generation based on specific failed evidence,
- global skill mastery across lessons,
- automated migration management,
- and production deployment hardening.

