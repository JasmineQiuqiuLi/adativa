"use client";

import { useEffect, useRef, useState } from "react";
import "./MultipleChoice.css";


export type MCQBlock = {
  content_id: string;
  type: "mcq";

  title?: string;
  question: string;

  options: {
    id: string;
    label: string;
  }[];

  correct_answer_id: string;

  explanation?: string;
};

export type MCQInteraction = {
  interaction_type:
    | "quiz_attempt"
    | "quiz_skip"
    | "quiz_abandon";

  started_at: string;
  submitted_at?: string;
  engagement_end?: string;

  response: string;
  is_correct: boolean;
  score: number;
  attempt_number: number;

  metadata?: {
    time_spent_ms: number;
    engagement_mode: "visibility_or_action_based";
  };
};

interface MultipleChoiceProps {
  content: MCQBlock;
  onInteraction?: (
    interaction: MCQInteraction
  ) => void;
}

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

export default function MultipleChoice({content,onInteraction,}: MultipleChoiceProps) {
  const [selectedId, setSelectedId] =useState("");

  const [submitted, setSubmitted] = useState(false);

  const containerRef =useRef<HTMLDivElement | null>(null);

  const selectedIdRef = useRef("");

  const attemptRef = useRef(1);

  const startedAtRef = useRef<number | null>(null);

  const dwellTimerRef = useRef<number | null>(null);

  const engagedRef = useRef(false);

  const hasSubmittedRef = useRef(false);

  const hasSkippedRef = useRef(false);

  const hasLoggedRef = useRef(false);

  function ensureStarted() {
    if (!engagedRef.current) {
      engagedRef.current = true;
    }

    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
  }

  function getTimeSpent() {
    if (!startedAtRef.current) {
      return 0;
    }

    return Date.now() - startedAtRef.current;
  }

  function calculateScore(isCorrect: boolean) {
    return isCorrect ? 1 : 0;
  }

  function handleSelect(optionId: string) {
    ensureStarted();

    selectedIdRef.current = optionId;

    setSelectedId(optionId);
  }

  function handleSubmit() {
    if (!selectedIdRef.current) return;

    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSubmittedRef.current = true;
    hasLoggedRef.current = true;

    const isCorrect =  selectedIdRef.current === content.correct_answer_id;

    const result: MCQInteraction = { 
      interaction_type: "quiz_attempt",

      started_at: new Date( startedAtRef.current!).toISOString(),

      submitted_at:  new Date().toISOString(),

      response: selectedIdRef.current,

      is_correct: isCorrect,

      score: calculateScore(isCorrect),

      attempt_number: attemptRef.current,

      metadata: {
        time_spent_ms: getTimeSpent(),
        engagement_mode:  "visibility_or_action_based",
      },
    };

    setSubmitted(true);

    onInteraction?.(result);
  }

  function handleSkip() {
    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSkippedRef.current = true;
    hasLoggedRef.current = true;

    const result: MCQInteraction = {
      interaction_type: "quiz_skip",

      started_at: new Date( startedAtRef.current!).toISOString(),

      submitted_at:new Date().toISOString(),

      response: "",

      is_correct: false,

      score: 0,

      attempt_number: attemptRef.current,

      metadata: {
        time_spent_ms: getTimeSpent(),
        engagement_mode:  "visibility_or_action_based",
      },
    };

    onInteraction?.(result);
  }

  function handleRetry() {
    setSelectedId("");
    setSubmitted(false);

    selectedIdRef.current = "";

    attemptRef.current += 1;

    startedAtRef.current = Date.now();

    engagedRef.current = true;

    hasSubmittedRef.current = false;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
  }

  useEffect(() => {
    const node = containerRef.current;

    if (!node) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&  entry.intersectionRatio >= VISIBILITY_THRESHOLD
          ) {
            if (!dwellTimerRef.current) {
              dwellTimerRef.current =
                window.setTimeout(() => {
                  ensureStarted();
                }, MIN_DWELL_TIME_MS);
            }
          } else {
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

      if (!engagedRef.current) return;

      if (!startedAtRef.current) return;

      if (
        hasSubmittedRef.current ||
        hasSkippedRef.current
      ) {
        return;
      }

      if (hasLoggedRef.current) return;

      hasLoggedRef.current = true;

      const result: MCQInteraction = {
        interaction_type: "quiz_abandon",

        started_at: new Date(
          startedAtRef.current
        ).toISOString(),

        engagement_end: new Date().toISOString(),

        response:selectedIdRef.current,

        is_correct: false,

        score: 0,

        attempt_number: attemptRef.current,

        metadata: {
          time_spent_ms: getTimeSpent(),

          engagement_mode:"visibility_or_action_based",
        },
      };

      onInteraction?.(result);
    };
  }, []);

  const isCorrect = selectedId === content.correct_answer_id;

return (
  <div
    ref={containerRef}
    className="mcq-block"
  >
    {content.title && (
      <h3 className="mcq-title">
        {content.title}
      </h3>
    )}

    <p className="mcq-question">
      {content.question}
    </p>

    <div className="mcq-options">

      {content.options.map(
        (option) => (

        <button
          key={option.id}
          className={`
            mcq-option
            ${
              selectedId === option.id
              ? "selected"
              : ""
            }
          `}
          disabled={submitted}
          onClick={() =>
            handleSelect(
              option.id
            )
          }
        >

          <div  className="mcq-option-main">

            <span className="mcq-label">
              {String.fromCharCode(
                65 +
                content.options.findIndex(
                  x =>
                    x.id ===
                    option.id
                )
              )}
            </span>

            <span className="mcq-option-text">
              {option.label}
            </span>
          </div>
        </button>
      ))}
    </div>

    {!submitted ? (

      <div className="mcq-actions" >
        <button
          className="mcq-submit"
          onClick={handleSubmit}
          disabled={!selectedId}
        >
          Submit
        </button>

        <button
          className="mcq-submit"
          onClick={handleSkip}
        >
          Skip
        </button>

      </div>

    ) : (

      <div className="mcq-feedback-global"
      >
        <p>
          {isCorrect ? "✅ Correct": "❌ Incorrect"}
        </p>

        {content.explanation && (
          <p>
            {content.explanation}
          </p>
        )}

        <button 
          className="mcq-retry"
          onClick={handleRetry}
        >
          Retry
        </button>
      </div>
    )}
  </div>
);
}