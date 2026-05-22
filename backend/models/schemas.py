from __future__ import annotations
from pydantic import BaseModel, Field, create_model
from typing import List, Literal, Annotated, Optional, Union
from enum import Enum


# -----------------------------
# Lesson / Objective Schemas
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

class GamePromptRequest(BaseModel):
    prompt:str


# -----------------------------
# Non-graded block models
# -----------------------------
class RichContentBlock(BaseModel):
    type: Literal['rich_content']
    variant:Optional[Literal["default","quote","statement","definition","summary"]]=None
    layout:Literal["text","image_top","image_left","image_right","hero"]="text"
    headline: Optional[str] = None
    body: Optional[str] = None
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    caption: Optional[str] = None


class AccordionItem(BaseModel):
    id:str
    title:str
    content:str

class AccordionBlock(BaseModel):
    type: Literal['accordion']
    items: List[AccordionItem]

class CharacterMessageBlock(BaseModel):
    type: Literal['character_message']
    variant:Literal["intro", "tip", "info", "warning", "explanation", "celebration"]
    layout:Optional[Literal["left","right","center"]]=None
    character_name:Optional[str]=None
    character_avatar:Optional[str]=None
    headline: Optional[str] = None
    body:str

class DiagramNode(BaseModel):
    id:str
    title:str
    description:Optional[str]=None

class ComparisonColumn(BaseModel):
    title:str
    items:List[str]

class DiagramBlock(BaseModel):
    type: Literal['diagram']
    variant:Literal["flow","timeline","hierarchy","comparison"]
    title:Optional[str]=None
    nodes:Optional[List[DiagramNode]]=None
    comparison_columns:Optional[List[ComparisonColumn]]=None

class Flashcard(BaseModel):
    id:str
    front:str
    back:str

class FlashCardsBlock(BaseModel):
    type:Literal["flash_cards"]
    title:Optional[str]=None
    cards:List[Flashcard]

class RevealBlock(BaseModel):
    type:Literal["reveal"]
    headline:Optional[str]=None
    prompt:str
    revealed_content: str
    button_label:Optional[str]=None

class ScenarioChoice(BaseModel):
    id:str
    label:str
    consequence:str

class ScenarioBlock(BaseModel):
    type:Literal["scenario"]
    title:Optional[str]=None
    scenario:str
    choices:List[ScenarioChoice]

class StepItem(BaseModel):
    id:str
    title:str
    content:str

class StepsBlock(BaseModel):
    type:Literal["steps"]
    title:str
    steps:List[StepItem]

class TabItem(BaseModel):
    id:str
    label:str
    content:str

class TabsBlock(BaseModel):
    type:Literal["tabs"]
    title:str
    tabs:List[TabItem]

class VideoBlock(BaseModel):
    type:Literal["video"]
    variant:Optional[Literal["default","featured","minimal"]]=None
    title:Optional[str]=None
    description:Optional[str]=None
    video_url:str
    thumbnail_url:Optional[str]=None
    caption:Optional[str]=None

# ─────────────────────────────────────────
# Graded block models
# ─────────────────────────────────────────
  
class MCQOption(BaseModel):
    id:str
    label:str # matches frontend MCQBlock options[].label

class MCQBlock(BaseModel):
    type:Literal["mcq"]
    title:Optional[str]=None
    question:str
    options:List[MCQOption]
    correct_answer_id:str
    explanation:Optional[str]=None

class FillBlankBlock(BaseModel):
    type:Literal["fill_blank"]
    title:Optional[str]=None
    question:str
    correct_answers:List[str]
    case_sensitive:bool=False
    explanation:Optional[str]=None

class GameBlock(BaseModel):
    type:Literal["game"]
    title:Optional[str]=None
    htmlContent:str #used to generate htmlContnet via /anthropic-game at render time


class MatchPair(BaseModel):
    id:str
    prompt:str
    answer:str

class MatchBlock(BaseModel):
    type:Literal["match"]
    title:Optional[str]=None
    question:str
    pairs:List[MatchPair]

class MultipleAnswerOption(BaseModel):
    id:str
    text:str # matches frontend multipleanswerblock options[].text
    feedback:Optional[str]=None

class MultipleAnswerBlock(BaseModel):
    type:Literal["multiple_answer"]
    title:Optional[str]=None
    question:str
    options:List[MultipleAnswerOption]
    correct_answer_ids:List[str]

class OrderItem(BaseModel):
    id:str
    text:str

class OrderBlock(BaseModel):
    type: Literal["order"]
    title: Optional[str]=None
    question: str
    items: List[OrderItem]
    correct_order_ids: List[str]

class ShortEssayBlock(BaseModel):
    type:Literal["short_essay"]
    title:Optional[str]=None
    question:str
    rubric_hint:Optional[str]=None

class TrueFalseBlock(BaseModel):
    type:Literal["true_false"]
    title: Optional[str]=None
    question:str
    correct_answer:Literal["true","false"]
    true_feedback:Optional[str]=None
    false_feedback:Optional[str]=None



# ─────────────────────────────────────────
# Registry + dynamic model factory
# ─────────────────────────────────────────

BLOCK_REGISTRY: dict[str, type[BaseModel]] = {
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
    "mcq":               MCQBlock,
    "order":             OrderBlock,
    "short_essay":       ShortEssayBlock,
    "true_false":        TrueFalseBlock,
}
    
def get_content_model(allowed_types: list[str] | None = None):
    """Builds a Pydantic model with a discriminated-union blocks list.
    Pass allowed_types to restrict the palette; None means all 18 types."""
    keys=allowed_types or list(BLOCK_REGISTRY.keys())

    variants=tuple(
        BLOCK_REGISTRY[k]
        for k in keys
        if k in BLOCK_REGISTRY
    )

    if not variants:
        variants=tuple(BLOCK_REGISTRY.values())

    BlockUnion=Annotated[
        Union[variants],
        Field(discriminator="type")
    ]

    return create_model(
        "LessonContent",
        blocks=(List[BlockUnion],...)
    )


# ─────────────────────────────────────────
# Generation strategy + request / response
# ─────────────────────────────────────────

class GenerationStrategy(str, Enum):
    SINGLE       = "single"        # one call, full schema
    PLAN_EXECUTE = "plan_execute"  # call 1: pick types; call 2: generate

class GenerateObjectiveContentRequest(BaseModel):
    mode: Literal["initial", "advance", "remedial"] = "initial"
    weak_skills: List[str] = []
    force_regenerate: bool = False
    strategy: GenerationStrategy = GenerationStrategy.PLAN_EXECUTE
    allowed_types: Optional[List[str]] = None  # None = full BLOCK_REGISTRY


class ContentBlockRow(BaseModel):
    id: int
    lesson_id: int
    objective_id: Optional[int] = None
    generation_mode: str
    strategy_used: str
    type: str
    title: Optional[str] = None
    data: dict
    order_index: int
    status: str = "active"



class ObjectiveContentResponse(BaseModel):
    objective_id: int
    mode: str
    blocks: List[ContentBlockRow]

class RegisterRequest(BaseModel):
    email:str
    password:str
    display_name:Optional[str]=None


class LoginRequest(BaseModel):
    email:str
    password:str

class UserResponse(BaseModel):
    id:int
    email:str
    display_name:Optional[str]=None



