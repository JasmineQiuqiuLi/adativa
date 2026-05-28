# Adativa — Project Overview

Adativa is an **AI-powered adaptive learning platform**. A user gives a learning goal; the system uses LLMs to generate a lesson plan (objectives → skills → content blocks), then renders an interactive lesson with mixed instructional and graded blocks while tracking per-user progress per objective.

---

## 1. Tech Stack

| Layer | Stack |
|------|------|
| Frontend | React 19 + TypeScript + Vite, react-router-dom v7, Zustand (with `persist`) for auth state, `react-markdown` + `remark-gfm` for markdown rendering |
| Backend | FastAPI (Python ≥ 3.12), `uvicorn`, `psycopg2` |
| Database | PostgreSQL (SSL required, connection via `DATABASE_URL`) |
| LLM providers | **OpenAI** `gpt-4o-mini` — objectives & skills generation. **Anthropic** `claude-sonnet-4-6` (via `instructor` for typed Pydantic responses, and raw client for game HTML) — content-block generation |
| Auth | `bcrypt` password hashing; client persists user in `localStorage` (key `adativa.user`) |
| Package mgmt | `uv` for backend (`uv.lock`, `pyproject.toml`), `npm` for frontend |


---

## 2. Top-Level Layout

```
adativa/
├── backend/                 FastAPI app
│   ├── main.py              All HTTP route handlers
│   ├── clients/             openai_client.py (singleton)
│   ├── services/            Business logic (lesson, content, progress, user)
│   ├── models/schemas.py    All Pydantic models + BLOCK_REGISTRY
│   └── database/            db.py (psycopg2 connection) + *.sql schema files
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── app/             App.tsx, routes.tsx, main.tsx
│       └── features/        Feature-sliced: auth/, content/, courses/, learning/
├── .claude/                 Claude Code config (claude.md guidelines + this file)
└── README.md                Single line: "# Project Overview"

```

---

## 3. Domain Model & Data Flow

### Core entities (PostgreSQL)

| Table | Purpose |
|------|------|
| `users` | id, email (unique), password_hash, display_name |
| `lessons` | goal, age_range, style, pace, status, created_by |
| `objectives` | lesson_id, order_index, title, description, status (soft-deletable) |
| `skills` | name (unique), description — globally deduplicated via upsert |
| `objective_skill_map` | M:N between objectives ↔ skills |
| `content_blocks` | lesson_id, objective_id, type, title, **data** (JSONB), generation_mode, strategy_used, order_index, status |
| `content_block_skills` | M:N between content_blocks ↔ skills (table exists; not yet wired into generation) |
| `user_objective_progress` | (user_id, objective_id) PK; status (`not_started`/`in_progress`/`completed`/`mastered`), attempts, correct, timestamps |

All `*_updated_at` columns are maintained by trigger functions (`update_updated_at_column`, `set_updated_at`).

### Lesson creation pipeline

```
User goal + (age_range, style, pace)
        │
        ▼
POST /lessons/create   → generate_objectives()  [OpenAI gpt-4o-mini, JSON mode]
        │
        ▼
INSERT lesson + objectives → returns lessonId
        │
        ▼
POST /lessons/{id}/skills (or auto-trigger on GET /objectives-with-skills)
        │  generate_skills_from_objectives()  [OpenAI, 2–3 skills/objective, Bloom's verbs]
        ▼
upsert skills + insert objective_skill_map
        │
        ▼
Per-objective: POST /lessons/{id}/objectives/{oid}/content
        │  generate_objective_content()  [Anthropic + Instructor]
        │  - mode: initial | advance | remedial
        │  - strategy: SINGLE | PLAN_EXECUTE
        ▼
INSERT content_blocks (each block as JSONB in `data`)
```

### Content generation strategies (`backend/services/content_service.py`)

- **SINGLE** — one Instructor call against the union of all (or `allowed_types`) block models.
- **PLAN_EXECUTE** — call 1 picks 3–5 block types with a rationale; call 2 generates blocks restricted to that narrowed schema. Default strategy.
- Mode shapes the user prompt: `initial` (teach from scratch + 1–2 graded items), `advance` (challenge problems), `remedial` (targets `weak_skills`).
- `existing_headlines` is passed in so the LLM avoids duplicating prior content for the same learner.
- System prompt uses Anthropic ephemeral cache control.

---

## 4. Backend Endpoints (`backend/main.py`)

| Method | Path | Purpose |
|------|------|------|
| GET | `/` | Health check |
| POST | `/users/register` | Register (bcrypt hash) |
| POST | `/users/login` | Authenticate, returns `{id, email, display_name}` |
| GET | `/lessons?user_id=` | List lessons for a user (excludes soft-deleted) |
| POST | `/lessons/create` | Create lesson + objectives via OpenAI |
| GET | `/lessons/{id}` | Get lesson + active objectives |
| DELETE | `/lessons/{id}` | Soft-delete (sets `status='deleted'`) |
| POST | `/lessons/{id}/revise` | Re-generate objectives from user feedback |
| POST | `/lessons/{id}/skills` | Generate + persist skills for all objectives |
| GET | `/lessons/{id}/objectives-with-skills` | Auto-generates skills if missing, returns nested structure |
| GET | `/lessons/{id}/progress?user_id=` | Per-objective progress + `current_objective_id` (first non-completed) |
| POST | `/lessons/{id}/objectives/{oid}/content` | Returns existing blocks or generates new; soft-deletes prior active blocks for that (objective, mode) before inserting |
| GET | `/debug/context/{lid}/{oid}` | Dump the generation-context bundle used for content prompts |
| POST | `/anthropic-game` | Raw Anthropic call returning HTML for `game`-type blocks (used at render time) |

CORS is wide-open (`allow_origins=["*"]`).

---

## 5. Frontend Architecture (`frontend/src/`)

### Routing (`app/routes.tsx`)

```
/login            Login            (public)
/register         Register         (public)
/                 CourseHome       (RequireAuth)
/course/:id       CourseDetail
/create-lesson    CreateLesson
/objectives/:id   ReviewObjective  (revise via feedback loop)
/skills/:id       ReviewSkills
/learn/:id        LearnLesson      (the actual lesson player)
/test             TestWrapper      (dev sandbox)
```

`RequireAuth` reads from the Zustand `useUser` store (persisted in `localStorage` under `adativa.user`). The API base URL is hard-coded to `http://127.0.0.1:8000` (see `features/learning/api.ts` and inline fetches in `CourseHome`).

### Feature slices

- **`features/auth/`** — `useUser` Zustand store, `RequireAuth` guard, `Login` / `Register` pages.
- **`features/courses/`** — Course list/cards, lesson creation, objective + skill review pages.
- **`features/content/`** — The block component library and renderer machinery (see §6).
- **`features/learning/`**
  - `api.ts` — typed fetchers for `fetchLessonProgress` and `fetchObjectiveContent`.
  - `pages/LearnLesson/LearnLesson.tsx` — drives the learn page; loads progress, derives `currentObjectiveId`, then loads its content.
  - `components/LearnView/` — renders the loaded blocks via `BlockRenderer`.
  - `components/LessonNavigation/`, `components/Chat/` — sidebars.

---

## 6. The Content-Block System

Both backend (Pydantic) and frontend (React) maintain parallel registries of block "types". The backend generates JSON conforming to a discriminated union (`type` field); the frontend picks a renderer from its `BLOCK_REGISTRY` by that same `type` string.

### Block catalog

| Category | Block types |
|------|------|
| Non-graded (10) | `accordion`, `character_message`, `diagram`, `flash_cards`, `reveal`, `rich_content`, `scenario`, `steps`, `tabs`, `video` |
| Graded (8) | `fill_blank`, `game`, `match`, `multiple_answer`, `multiple_choice`, `order`, `short_essay`, `true_false` |

Backend registry: `backend/models/schemas.py` → `BLOCK_REGISTRY` + `get_content_model(allowed_types)` builds a dynamic `LessonContent` model with `blocks: List[BlockUnion]` (discriminator = `type`).

Frontend registry: `frontend/src/features/content/renderers/BlockRegistry.ts` maps each `type` string → React component in `features/content/components/<Name>/`.


### Rendering pipeline (`BlockRenderer.tsx`)

```
ContentBlock from API
   │
   ▼
transformMarkdown / renderMarkdown (utils/) → produces `content` payload
   │
   ▼
BLOCK_REGISTRY[block.type] → component
   │
   ▼
<Component content={...} onInteraction={...} gradeAnswer={...} />
```

`short_essay` is the one block requiring an extra `gradeAnswer` prop (LLM-graded). The `game` block stores `htmlContent` generated at content-creation time via `/anthropic-game`.

### Character assets

`frontend/public/characters/` contains 12 SVG avatars across four roles (`teacher`, `engineer`, `scientist`, `mentor`), variants `_1` / `_2` / `_3`. Used by `CharacterMessage` blocks via `features/content/data/characterRegistry.ts`.

---

## 7. Progress Tracking

- `GET /lessons/{id}/progress` left-joins `objectives` with `user_objective_progress`, so missing rows are returned with `status: "not_started"`.
- `current_objective_id` = first objective whose status is null / `not_started` / `in_progress`. When all objectives are completed, it's `null` and the frontend shows a "Lesson complete" state.
- The actual writes to `user_objective_progress` (attempts / correct / status transitions) are **not** in the current backend — the table and read path exist, but write endpoints aren't wired yet.

---


# Content Block Registry
```
BLOCK_REGISTRY = {
    # non-graded
    "accordion":         AccordionBlock,
    "character_message": CharacterMessageBlock,
    "diagram":           DiagramBlock,
    "flash_cards":       FlashCardsBlock,
    "reveal":            RevealBlock,
    "rich_content":      RichContentBlock,
    "scenario":          ScenarioBlock,
    "steps":             StepsBlock,
    "tabs":              TabsBlock,
    "video":             VideoBlock,
    # graded
    "fill_blank":        FillBlankBlock,
    "game":              GameBlock,
    "match":             MatchBlock,
    "multiple_answer":   MultipleAnswerBlock,
    "multiple_choice":   MCQBlock,
    "order":             OrderBlock,
    "short_essay":       ShortEssayBlock,
    "true_false":        TrueFalseBlock,
}
```
