"use client";

import {
  useEffect,
  useRef,
} from "react";

import "./Divider.css";

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

export type DividerInteraction = {
  interaction_type: "divider_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    variant: DividerVariant;

    has_label: boolean;

    engagement_mode:
      | "visibility_based";

    visible_duration_ms: number;
  };
};

type DividerProps = {
  content: DividerBlock;

  onInteraction?: (
    interaction: DividerInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 600;

const Divider = ({
  content,
  onInteraction,
}: DividerProps) => {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const startedAtRef = useRef<number | null>(
    null
  );

  const dwellTimerRef =
    useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  const variant =
    content.variant || "line";

  useEffect(() => {
    const node = containerRef.current;

    if (!node) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >=
              VISIBILITY_THRESHOLD
          ) {
            if (!dwellTimerRef.current) {
              dwellTimerRef.current =
                window.setTimeout(() => {
                  if (
                    !startedAtRef.current
                  ) {
                    startedAtRef.current =
                      Date.now();
                  }
                }, MIN_DWELL_TIME_MS);
            }
          } else {
            if (dwellTimerRef.current) {
              clearTimeout(
                dwellTimerRef.current
              );

              dwellTimerRef.current =
                null;
            }
          }
        },
        {
          threshold:
            VISIBILITY_THRESHOLD,
        }
      );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (dwellTimerRef.current) {
        clearTimeout(
          dwellTimerRef.current
        );
      }

      if (!startedAtRef.current)
        return;

      if (hasLoggedRef.current)
        return;

      hasLoggedRef.current = true;

      const engagementEnd = Date.now();

      const interaction: DividerInteraction =
        {
          interaction_type:
            "divider_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            variant,

            has_label:
              !!content.label,

            engagement_mode:
              "visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current,
          },
        };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`divider-block ${variant}`}
    >
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