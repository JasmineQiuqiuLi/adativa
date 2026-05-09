"use client";

import {
  useEffect,
  useRef,
} from "react";

import "./Steps.css";

export type StepItem = {
  id: string;
  title: string;
  content: string;
};

export type StepsContent = {
  content_id: string;
  type: string;
  title: string;
  steps: StepItem[];
};

export type StepsInteraction = {
  interaction_type: "steps_session";

  started_at: string;
  engagement_end: string;

  metadata: {
    steps_viewed: number;
    viewed_step_ids: string[];
    completed: boolean;

    engagement_mode: "visibility_based";
    visible_duration_ms: number;
  };
};

type StepsProps = {
  content: StepsContent;
  onInteraction?: (
    interaction: StepsInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

const Steps = ({
  content,
  onInteraction,
}: StepsProps) => {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const startedAtRef = useRef<number | null>(null);

  const visibleStartRef = useRef<number | null>(null);

  const engagedRef = useRef(false);

  const dwellTimerRef =
    useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // entered visibility threshold
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >=
            VISIBILITY_THRESHOLD
        ) {
          visibleStartRef.current =
            Date.now();

          // wait for minimum dwell time
          dwellTimerRef.current =
            window.setTimeout(() => {
              if (!engagedRef.current) {
                engagedRef.current = true;

                startedAtRef.current =Date.now();
              }
            }, MIN_DWELL_TIME_MS);
        }

        // left visibility threshold
        else {
          visibleStartRef.current = null;

          if (dwellTimerRef.current) {
            clearTimeout(
              dwellTimerRef.current
            );

            dwellTimerRef.current = null;
          }
        }
      },
      {
        threshold: VISIBILITY_THRESHOLD,
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

      // never engaged
      if (!engagedRef.current) return;

      // prevent duplicate logs
      if (hasLoggedRef.current) return;

      hasLoggedRef.current = true;

      const engagementEnd = Date.now();

      const interaction: StepsInteraction =
        {
          interaction_type:"steps_session",

          started_at: new Date(startedAtRef.current!).toISOString(),

          engagement_end: new Date(engagementEnd).toISOString(),

          metadata: {
            steps_viewed:
              content.steps.length,

            viewed_step_ids:
              content.steps.map(
                (step) => step.id
              ),

            completed: true,

            engagement_mode:"visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current!,
          },
        };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="steps-block"
    >
      <div className="steps-header">
        <h3 className="steps-title">
          {content.title}
        </h3>
      </div>

      <div className="steps-list">
        {content.steps.map(
          (step, idx) => (
            <div
              key={step.id}
              className="steps-item"
            >
              <div className="steps-item-left">
                <div className="steps-circle">
                  {idx + 1}
                </div>

                {idx !==
                  content.steps.length -
                    1 && (
                  <div className="steps-line" />
                )}
              </div>

              <div className="steps-item-content">
                <div className="steps-step-title">
                  {step.title}
                </div>

                <div className="steps-content">
                  {step.content}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Steps;