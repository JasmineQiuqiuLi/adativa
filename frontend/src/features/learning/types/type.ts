export type {
  AttemptPayload,
  EngagementSnapshot,
  EngagementRecord,
  InteractionRecord,
} from "../../content/components/EngagementWrapper/EngagementWrapper";

import type {
  InteractionRecord,
  EngagementRecord,
} from "../../content/components/EngagementWrapper/EngagementWrapper";

// Sent to POST /interactions. Adds the system fields the wrapper does not own.
export type InteractionCreatePayload = InteractionRecord & {
  user_id: number;
  session_id: string;
};

// Sent to PATCH /interactions/engagement/{engagement_id}. Only the engagement
// fields that finalize at unmount.
export type EngagementFinalizePayload = Pick<
  EngagementRecord,
  "engagement_end" | "active_duration_ms"
>;
