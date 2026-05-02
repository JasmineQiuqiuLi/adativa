from pydantic import BaseModel
from typing import List, Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from services.lesson_service import generate_objectives,save_lesson_to_db,get_lesson_by_id,get_active_objectives,revise_with_ai,replace_objectives
from models.schemas import CreateLessonRequest,CreateLessonResponse, GeneratedObjective,CreateLessonDBResponse
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
# Mock data (temporary)
# -----------------------------

mock_objectives = [
    {
        "orderIndex": 1,
        "title": "Understand AI basics",
        "description": "Learn what AI is"
    },
    {
        "orderIndex": 2,
        "title": "Learn ML concepts",
        "description": "Understand supervised learning"
    }
]


# -----------------------------
# Endpoints
# -----------------------------


@app.get("/")
def root():
    return {"message":"backend is running"}

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


@app.post("/objectives/revise",response_model=List[GeneratedObjective])
def revise_objectives(req:ReviseRequest):
    updated: List[GeneratedObjective] = []
    for obj in mock_objectives:
        updated.append({
            **obj,
            "description":obj['description']+f"(Refined: {req.feedback})"
        })
    return updated


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