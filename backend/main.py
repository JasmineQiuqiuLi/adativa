import json
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from services.lesson_service import (
    generate_objectives,
    save_lesson_to_db,
    get_lesson_by_id,
    get_active_objectives,
    revise_with_ai,
    replace_objectives,
    generate_and_store_skills_for_lesson,
    get_objectives_with_skills_db,
    get_lessons_db,
    soft_delete_lessons
)
from services.content_service import (
    generate_anthropic_content,
    generate_objective_content,
)
from services.content_skill_tagging_service import (
    backfill_lesson_content_block_skills,
    tag_content_blocks_for_objective,
)

from services.progress_service import get_lesson_progress, update_objective_progress

from services.interaction_service import (
    create_interaction,
    finalize_engagement,
)

from models.schemas import (
    CreateLessonRequest,
    CreateLessonResponse,
    CreateLessonDBResponse,
    GamePromptRequest,
    GenerateObjectiveContentRequest,
    ObjectiveContentResponse,
    ContentBlockRow,
    ContentBlockSkillBackfillResponse,
    RegisterRequest,
    LoginRequest,
    UserResponse,
    LessonProgressResponse,
    ObjectiveProgressUpdateRequest,
    InteractionCreateRequest,
    InteractionCreateResponse,
    EngagementFinalizeRequest,
)

from services.user_service import (register_user,authenticate_user)


from fastapi import HTTPException
from database.db import get_connection


logger=logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ======================
# app setup
# ======================

app=FastAPI()

# Allow frontend (React) to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# -----------------------------
# Data models (schemas)
# -----------------------------



class ReviseRequest(BaseModel):
    feedback: str


def _fetch_generation_context(cur, lesson_id: int, objective_id: int):
    cur.execute("""
        SELECT l.age_range, l.style, l.pace,
                o.title, o.description
        FROM lessons l
        JOIN objectives o ON o.lesson_id = l.id
        WHERE l.id = %s AND o.id = %s AND o.status = 'active';
    """, (lesson_id, objective_id))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Lesson or objective not found")
    age_range, style, pace, title, description = row

    cur.execute("""
        SELECT s.name
        FROM objective_skill_map osm
        JOIN skills s ON s.id = osm.skill_id
        WHERE osm.objective_id = %s;
    """, (objective_id,))
    skills = [r[0] for r in cur.fetchall()]

    cur.execute("""
        SELECT COALESCE(
            data->>'title',
            data->>'question',
            data->>'headline'
        )
        FROM content_blocks
        WHERE objective_id=%s
        AND status='active';
    """, (objective_id,))
    existing_headlines = [r[0] for r in cur.fetchall() if r[0]]

    return {
        "objective": {"title": title, "description": description},
        "skills": skills,
        "age_range": age_range,
        "style": style,
        "pace": pace,
        "existing_headlines": existing_headlines,
    }

# -----------------------------
# Endpoints
# -----------------------------


@app.get("/")
def root():
    return {"message":"backend is running"}

@app.get("/lessons")
def get_lessons(user_id:int):
    lessons=get_lessons_db(user_id)
    return {"lessons":lessons}

@app.post("/lessons/create",response_model=CreateLessonDBResponse)
def create_lesson(req:CreateLessonRequest):
    logger.info(f"Received request:{req}")

    # generate response with OpenAI
    result=generate_objectives(
        goal=req.goal,
        age_range=req.ageRange,
        style=req.style,
        pace=req.pace
    )

    # save to db
    lesson_id=save_lesson_to_db(
        goal=req.goal,
        age_range=req.ageRange,
        style=req.style,
        pace=req.pace,
        created_by=req.created_by,
        objectives=[obj.dict() for obj in result.objectives]
    )
    return {"lessonId":lesson_id}

@app.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id:int):
    soft_delete_lessons(lesson_id)
    return {"message":"lesson deleted"}

@app.get("/lessons/{lesson_id}",response_model=CreateLessonResponse)
def get_lesson(lesson_id:int):
    result=get_lesson_by_id(lesson_id)
    if not result:
        raise HTTPException(status_code=404,detail='Lesson not found')
    return result

@app.post("/lessons/{lesson_id}/revise")
def revise_objectives(lesson_id:int,req:ReviseRequest):
    conn=get_connection()

    try:
        cur=conn.cursor()

        # 1. get current objectives
        current=get_active_objectives(cur,lesson_id)

        # 2. AI revise
        new_objectives=revise_with_ai(current,req.feedback)

        # 3. replace in DB
        replace_objectives(conn,lesson_id,new_objectives)

        return new_objectives
    
    except Exception as e:
        raise e
    
    finally:
        cur.close()
        conn.close()

@app.post("/lessons/{lesson_id}/skills")
def generate_skills(lesson_id:int):
    generate_and_store_skills_for_lesson(lesson_id)
    return {"message":"skills generated"}


@app.get("/lessons/{lesson_id}/objectives-with-skills")
def get_or_generate_skills(lesson_id: int):
    conn = get_connection()

    try:
        cur = conn.cursor()

        # 1. check if skills already exist
        cur.execute("""
            SELECT COUNT(*)
            FROM objective_skill_map osm
            JOIN objectives o ON osm.objective_id = o.id
            WHERE o.lesson_id = %s;
        """, (lesson_id,))

        count = cur.fetchone()[0]

        # 2. if not exist → generate
        if count == 0:
            generate_and_store_skills_for_lesson(lesson_id)

        # 3. always return structured data
        data = get_objectives_with_skills_db(cur, lesson_id)

        return {"objectives": data}

    finally:
        conn.close()

class PromptRequest(BaseModel):
    prompt: str


@app.get("/lessons/{lesson_id}/progress",response_model=LessonProgressResponse)
def get_lesson_progress_route(lesson_id:int,user_id:int):
    return get_lesson_progress(user_id=user_id,lesson_id=lesson_id)


@app.post(
    "/lessons/{lesson_id}/objectives/{objective_id}/progress",
    response_model=LessonProgressResponse,
)
def update_objective_progress_route(
    lesson_id: int,
    objective_id: int,
    req: ObjectiveProgressUpdateRequest,
):
    try:
        return update_objective_progress(
            user_id=req.user_id,
            lesson_id=lesson_id,
            objective_id=objective_id,
            status=req.status,
            attempts_delta=req.attempts_delta,
            correct_delta=req.correct_delta,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@app.post("/anthropic-game")
def generate_anthropic(req: PromptRequest):
    html = generate_anthropic_content(req.prompt)
    return {"html": html}


@app.get("/debug/context/{lesson_id}/{objective_id}")
def debug_context(
    lesson_id: int,
    objective_id: int
):
    conn = get_connection()

    try:
        cur = conn.cursor()

        ctx = _fetch_generation_context(
            cur,
            lesson_id,
            objective_id
        )

        return ctx

    finally:
        conn.close()

@app.post(
    "/lessons/{lesson_id}/objectives/{objective_id}/content",
    response_model=ObjectiveContentResponse,
)
def generate_objective_content_route(
    lesson_id: int,
    objective_id: int,
    req: GenerateObjectiveContentRequest,
):
    conn = get_connection()
    try:
        cur = conn.cursor()

        # 1. return existing blocks if any and force_regenerate is False
        if not req.force_regenerate:
            cur.execute("""
                SELECT id, lesson_id, objective_id, generation_mode, strategy_used,
                        type, title, data, order_index, status
                FROM content_blocks
                WHERE objective_id = %s
                AND generation_mode = %s
                AND status = 'active'
                ORDER BY order_index;
            """, (objective_id, req.mode))
            existing = cur.fetchall()
            if existing:
                blocks = [
                    ContentBlockRow(
                        id=r[0], lesson_id=r[1], objective_id=r[2],
                        generation_mode=r[3], strategy_used=r[4],
                        type=r[5], title=r[6], data=r[7],
                        order_index=r[8], status=r[9],
                    )
                    for r in existing
                ]
                return ObjectiveContentResponse(
                    objective_id=objective_id, mode=req.mode, blocks=blocks
                )

        # 2. fetch generation context
        ctx = _fetch_generation_context(cur, lesson_id, objective_id)

        # 3. soft-delete prior blocks for this (objective, mode)
        cur.execute("""
            UPDATE content_blocks
            SET status = 'deleted'
            WHERE objective_id = %s
            AND generation_mode = %s
            AND status = 'active';
        """, (objective_id, req.mode))

        # 4. generate
        block_dicts = generate_objective_content(
            strategy=req.strategy,
            mode=req.mode,
            objective=ctx["objective"],
            skills=ctx["skills"],
            age_range=ctx["age_range"],
            style=ctx["style"],
            pace=ctx["pace"],
            weak_skills=req.weak_skills,
            allowed_types=req.allowed_types,
            existing_headlines=ctx["existing_headlines"],
        )

        # 5. insert
        inserted: list[ContentBlockRow] = []
        for idx, block in enumerate(block_dicts):
            cur.execute("""
                INSERT INTO content_blocks
                (lesson_id, objective_id, generation_mode, strategy_used,
                    type, title, data, order_index, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, 'active')
                RETURNING id;
            """, (
                lesson_id,
                objective_id,
                req.mode,
                req.strategy.value,
                block["type"],
                block.get("title") or block.get("headline"),
                json.dumps(block),
                idx,
            ))
            new_id = cur.fetchone()[0]
            inserted.append(ContentBlockRow(
                id=new_id,
                lesson_id=lesson_id,
                objective_id=objective_id,
                generation_mode=req.mode,
                strategy_used=req.strategy.value,
                type=block["type"],
                title=block.get("title") or block.get("headline"),
                data=block,
                order_index=idx,
                status="active",
            ))

        tag_content_blocks_for_objective(
            cur=cur,
            objective_id=objective_id,
            blocks=inserted,
            force=True,
        )

        conn.commit()
        return ObjectiveContentResponse(
            objective_id=objective_id, mode=req.mode, blocks=inserted
        )

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.post(
    "/lessons/{lesson_id}/content-block-skills/backfill",
    response_model=ContentBlockSkillBackfillResponse,
)
def backfill_content_block_skills_route(
    lesson_id: int,
    force: bool = False,
):
    conn = get_connection()
    cur = None
    try:
        cur = conn.cursor()
        counts = backfill_lesson_content_block_skills(
            cur=cur,
            lesson_id=lesson_id,
            force=force,
        )
        conn.commit()
        return ContentBlockSkillBackfillResponse(
            lesson_id=lesson_id,
            **counts,
        )
    except Exception:
        conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        conn.close()


@app.post("/interactions", response_model=InteractionCreateResponse)
def create_interaction_route(req: InteractionCreateRequest):
    new_id = create_interaction(req.model_dump())
    return InteractionCreateResponse(id=new_id)


@app.patch("/interactions/engagement/{engagement_id}")
def finalize_engagement_route(
    engagement_id: str,
    req: EngagementFinalizeRequest,
):
    updated = finalize_engagement(
        engagement_id=engagement_id,
        engagement_end=req.engagement_end,
        active_duration_ms=req.active_duration_ms,
    )
    if updated == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No interactions found for engagement_id {engagement_id}",
        )
    return {"updated": updated}


@app.post("/users/register",response_model=UserResponse)
def register_user_route(req:RegisterRequest):
    user=register_user(
        email=req.email,
        password=req.password,
        display_name=req.display_name
    )
    return user

@app.post("/users/login",response_model=UserResponse)
def login_user_route(req:LoginRequest):
    user=authenticate_user(
        email=req.email,
        password=req.password
    )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    return user
