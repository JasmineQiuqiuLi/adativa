from pydantic import BaseModel
from typing import List, Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import requests
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
from services.content_service import generate_anthropic_content
from models.schemas import CreateLessonRequest,CreateLessonResponse, CreateLessonDBResponse, GamePromptRequest
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

# -----------------------------
# Endpoints
# -----------------------------


@app.get("/")
def root():
    return {"message":"backend is running"}

@app.get("/lessons")
def get_lessons():
    lessons=get_lessons_db()
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

@app.post("/anthropic-game")
def generate_anthropic(req: PromptRequest):
    html = generate_anthropic_content(req.prompt)
    return {"html": html}