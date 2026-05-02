from pydantic import BaseModel
from typing import List, Literal


# -----------------------------
# Data models (schemas)
# -----------------------------

class CreateLessonRequest(BaseModel):
    goal:str
    ageRange:str
    style:Literal["visual","reading","hands-on","mixed"]
    pace:Literal["relaxed","normal","intensive"]

class GeneratedObjective(BaseModel):
    orderIndex:int
    title:str
    description:str

class CreateLessonResponse(BaseModel):
    lessonTitle:str
    objectives:List[GeneratedObjective]

class ReviseRequest(BaseModel):
    feedback: str

class CreateLessonDBResponse(BaseModel):
    lessonId:int

class LessonAIOutput(BaseModel):
    lessonTitle: str
    objectives: List[GeneratedObjective]

