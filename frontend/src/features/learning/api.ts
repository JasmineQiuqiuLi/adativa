import type {
    InteractionCreatePayload,
    EngagementFinalizePayload,
} from "./types/type";

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

export type ObjectiveProgressUpdate = {
    status?: ProgressStatus;
    attempts_delta?: number;
    correct_delta?: number;
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
export type ProgressionAction = "remedial" | "advance" | "next";

export type ContentRequest = {
    mode?: GenerationMode;
    weak_skills?: string[];
    force_regenerate?: boolean;
    strategy?: GenerationStrategy;
    allowed_types?: string[] | null;
};

export type ObjectiveProgressionOption = {
    action: ProgressionAction;
    label: string;
    description: string;
    enabled: boolean;
    recommended: boolean;
};

export type ObjectiveProgressionRecommendation = {
    recommended_action: ProgressionAction;
    reason: string;
    weak_skills: string[];
    options: ObjectiveProgressionOption[];
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

export async function updateObjectiveProgress(
    lessonId: string | number,
    objectiveId: number,
    userId: number,
    body: ObjectiveProgressUpdate
): Promise<LessonProgress> {
    const res = await fetch(
        `${API_BASE}/lessons/${lessonId}/objectives/${objectiveId}/progress`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                status: body.status,
                attempts_delta: body.attempts_delta ?? 0,
                correct_delta: body.correct_delta ?? 0,
            }),
        }
    );
    if (!res.ok) {
        throw new Error(`Failed to update progress (${res.status})`);
    }
    return res.json();
}

export async function fetchObjectiveProgression(
    lessonId: string | number,
    objectiveId: number,
    userId: number
): Promise<ObjectiveProgressionRecommendation> {
    const res = await fetch(
        `${API_BASE}/lessons/${lessonId}/objectives/${objectiveId}/progression?user_id=${userId}`
    );
    if (!res.ok) {
        throw new Error(`Failed to fetch progression (${res.status})`);
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


// ----- Interactions -----

export type InteractionCreatedResponse = {
    id: number;
};

// `keepalive: true` lets the browser complete the request even after the page
// is being unloaded (tab close, navigation). Required for pagehide-driven
// engagement_end PATCHes and abandon POSTs to actually reach the server.
export async function postInteraction(
    payload: InteractionCreatePayload
): Promise<InteractionCreatedResponse> {
    const res = await fetch(`${API_BASE}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
    });
    if (!res.ok) {
        throw new Error(`Failed to create interaction (${res.status})`);
    }
    return res.json();
}

export async function patchInteractionEngagement(
    engagementId: string,
    payload: EngagementFinalizePayload
): Promise<void> {
    const res = await fetch(
        `${API_BASE}/interactions/engagement/${engagementId}`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
        }
    );
    if (!res.ok) {
        throw new Error(`Failed to update engagement (${res.status})`);
    }
}
