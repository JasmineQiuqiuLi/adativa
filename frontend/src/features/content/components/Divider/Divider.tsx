"use client";

import { useRef } from "react";

import "./Divider.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

export type DividerVariant =
  | "line"
  | "gradient"
  | "icon"
  | "chapter"
  | "spacer";

export type DividerBlock = {
  content_id: string;

  type: "divider";

  variant?: DividerVariant;

  label?: string;

  icon?: string;
};

type DividerProps = {
  content: DividerBlock;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Divider = ({
  content,
  onInteraction,
}: DividerProps) => {
  const variant = content.variant || "line";

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "divider_session",
      attempt_number: 0,
      metadata: {
        variant,
        has_label: !!content.label,
      },
    });
  });

  return (
    <div className={`divider-block ${variant}`}>
      {variant === "spacer" ? null : (
        <>
          <div className="divider-line" />

          {(content.label ||
            content.icon) && (
            <div className="divider-center">
              {content.icon && (
                <span className="divider-icon">
                  {content.icon}
                </span>
              )}

              {content.label && (
                <span className="divider-label">
                  {content.label}
                </span>
              )}
            </div>
          )}

          <div className="divider-line" />
        </>
      )}
    </div>
  );
};

export default Divider;
