const API_BASE = "http://127.0.0.1:8000";

// ----- Progress types -----

export type ProgressStatus =
    | "not_started"
    | "in_progress"
    | "completed"
    | "mastered";

export type ObjectiveProgress = {
    objective_id: number;
    order_index: number;
    status: ProgressStatus;
    attempts: number;
    correct: number;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string | null;
};

export type LessonProgress = {
    current_objective_id: number | null;
    objectives: ObjectiveProgress[];
};

// ----- Content types -----

export type ContentBlock = {
    id: number;
    lesson_id: number;
    objective_id: number | null;
    generation_mode: string;
    strategy_used: string;
    type: string;
    title: string | null;
    data: Record<string, any>;
    order_index: number;
    status: string;
};

export type ObjectiveContent = {
    objective_id: number;
    mode: string;
    blocks: ContentBlock[];
};

export type GenerationMode = "initial" | "advance" | "remedial";
export type GenerationStrategy = "single" | "plan_execute";

export type ContentRequest = {
    mode?: GenerationMode;
    weak_skills?: string[];
    force_regenerate?: boolean;
    strategy?: GenerationStrategy;
    allowed_types?: string[] | null;
};

// ----- Fetchers -----

export async function fetchLessonProgress(
    lessonId: string | number,
    userId: number
): Promise<LessonProgress> {
    const res = await fetch(
        `${API_BASE}/lessons/${lessonId}/progress?user_id=${userId}`
    );
    if (!res.ok) {
        throw new Error(`Failed to fetch progress (${res.status})`);
    }
    return res.json();
}


export async function fetchObjectiveContent(
  lessonId: string | number,
  objectiveId: number,
  body: ContentRequest = {}
): Promise<ObjectiveContent> {

  const res = await fetch(
    `${API_BASE}/lessons/${lessonId}/objectives/${objectiveId}/content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mode: body.mode ?? "initial",
        weak_skills: body.weak_skills ?? [],
        force_regenerate: body.force_regenerate ?? false,
        strategy: body.strategy ?? "plan_execute",
        allowed_types: body.allowed_types ?? null,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch content (${res.status})`
    );
  }

  return res.json();
}