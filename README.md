# Aditiva

Aditiva is a learning app for creating AI-assisted lessons, generating objective-based content, and tracking learner progress and skill mastery.

The project is split into:

- `frontend/` - React, TypeScript, Vite single-page app.
- `backend/` - FastAPI service for lesson generation, content generation, authentication, progress, interactions, and skill mastery.
- `backend/database/` - SQL schema files for lessons, objectives, users, interactions, content blocks, and progress tracking.

## Features

- Create lessons from a goal, age range, style, and pace.
- Generate and revise lesson objectives with AI.
- Generate rich objective content, including interactive blocks such as multiple choice, fill-in-the-blank, flash cards, matching, ordering, tabs, reveal, steps, scenarios, diagrams, and games.
- Track objective progress, engagement, interactions, and skill mastery.
- Review weak skills and route learners toward remedial, advance, or next-objective content.
- Register and log in users.

## Tech Stack

Frontend:

- React 19
- TypeScript
- Vite
- React Router
- Zustand

Backend:

- Python 3.12+
- FastAPI
- Uvicorn
- PostgreSQL via `psycopg2`
- OpenAI, Anthropic, and optional Tavily integration

## Prerequisites

- Node.js and npm
- Python 3.12+
- PostgreSQL database
- API keys for the AI providers you plan to use

## Environment Variables

Create a `.env` file in the project root for backend configuration:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key
```

`TAVILY_API_KEY` is used for rich content image enrichment. If that workflow is not needed, it can be omitted.

The frontend currently calls the backend at `http://127.0.0.1:8000`.

## Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd backend
uv sync
```

If you are not using `uv`, install the dependencies listed in `backend/pyproject.toml` into your Python 3.12+ environment.

## Database

Apply the SQL files in `backend/database/` to your PostgreSQL database before running the app. The schema files define lessons, objectives, content blocks, users, interactions, skill mappings, and progress tables.

## Running Locally

Start the backend:

```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Useful Commands

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd backend
python -m uvicorn main:app --reload
```

## API Overview

The backend exposes endpoints for:

- `GET /` - health check.
- `GET /lessons` - list lessons for a user.
- `POST /lessons/create` - create a lesson and generate objectives.
- `GET /lessons/{lesson_id}` - fetch lesson details.
- `POST /lessons/{lesson_id}/revise` - revise lesson objectives.
- `POST /lessons/{lesson_id}/objectives/{objective_id}/content` - generate or fetch objective content.
- `GET /lessons/{lesson_id}/progress` - fetch lesson progress.
- `POST /lessons/{lesson_id}/objectives/{objective_id}/progress` - update objective progress.
- `GET /lessons/{lesson_id}/skills/mastery` - fetch skill mastery.
- `POST /interactions` - record learner interactions.
- `POST /users/register` and `POST /users/login` - user authentication.

FastAPI docs are available while the backend is running at:

```text
http://127.0.0.1:8000/docs
```

## Project Structure

```text
.
|-- backend/
|   |-- clients/
|   |-- database/
|   |-- models/
|   |-- services/
|   |-- main.py
|   `-- pyproject.toml
`-- frontend/
    |-- public/
    |-- src/
    |   |-- app/
    |   |-- features/
    |   `-- shared/
    |-- package.json
    `-- vite.config.ts
```

## Notes

- The backend enables permissive CORS for local development.
- The frontend API base URL is hard-coded in `frontend/src/features/learning/api.ts`.
- Keep `.env` files out of source control because they contain secrets.
