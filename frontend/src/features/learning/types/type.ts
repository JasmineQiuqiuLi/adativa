
export type InteractionResult = {
  interaction_type:string;
  started_at: string;
  submitted_at?: string;
  engagement_end?: string;
  response: string;
  is_correct: boolean;
  score: number;
  attempt_number: number;
  metadata?: Record<string, any>;
};

