"use client";

import { useEffect,useRef, useState,} from "react";

import "./Reveal.css";

export type RevealBlock = {
  content_id: string;
  type: "reveal";
  headline?: string;
  prompt: string;
  revealed_content: string;
  button_label?: string;
};

export type RevealInteraction = {
  interaction_type: "reveal_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    revealed: boolean;

    reveal_count: number;

    engagement_mode: "visibility_based";

    visible_duration_ms: number;
  };
};

type RevealProps = {
  content: RevealBlock;

  onInteraction?: (
    interaction: RevealInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 1000;

const Reveal = ({
  content,
  onInteraction,
}: RevealProps) => {
  const [revealed, setRevealed] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const startedAtRef = useRef<number | null>(
    null
  );

  const dwellTimerRef =
    useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  const revealCountRef = useRef(0);

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

      const interaction: RevealInteraction =
        {
          interaction_type:
            "reveal_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            revealed,

            reveal_count:
              revealCountRef.current,

            engagement_mode:
              "visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current,
          },
        };

      onInteraction?.(interaction);
    };
  }, [ ]);

  const handleReveal = () => {
    if (!revealed) {
      revealCountRef.current += 1;
    }

    setRevealed((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className="reveal-block"
    >
      {content.headline && (
        <h3 className="reveal-headline">
          {content.headline}
        </h3>
      )}

      <div className="reveal-prompt">
        {content.prompt}
      </div>

      <button
        className="reveal-button"
        onClick={handleReveal}
      >
        {revealed
          ? "Hide"
          : content.button_label ||
            "Reveal"}
      </button>

      {revealed && (
        <div className="reveal-content">
          {content.revealed_content}
        </div>
      )}
    </div>
  );
};

export default Reveal;