"use client";

import { useEffect, useRef, useState } from "react";
import "./FillBlank.css";


export type FillBlankBlock = {
  content_id: string;
  type: "fill_blank";
  title?: string;
  question: string;
  correct_answers: string[];
  case_sensitive?: boolean;
  explanation?: string;
};

export type FillBlankInteraction = {
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

interface FillBlankProps {
  content: FillBlankBlock;
  onInteraction?: (interaction: FillBlankInteraction) => void;
}

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

export default function FillBlank({ content, onInteraction }: FillBlankProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef("");
  const attemptRef = useRef(1);
  const startedAtRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const engagedRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const hasSkippedRef = useRef(false);
  const hasLoggedRef = useRef(false);

  // Mirrors MultipleChoice: engagement is only confirmed after the component has
  // been visible for MIN_DWELL_TIME_MS *or* the user actively interacts with it.
  // This prevents React Strict Mode's double-mount from firing a spurious abandon.
  function ensureStarted() {
    if (!engagedRef.current) {
      engagedRef.current = true;
    }
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
  }

  function getTimeSpent() {
    if (!startedAtRef.current) return 0;
    return Date.now() - startedAtRef.current;
  }

  function normalizeText(text: string) {
    let result = text.trim().replace(/\s+/g, " ");
    if (!content.case_sensitive) {
      result = result.toLowerCase();
    }
    return result;
  }

  function evaluateAnswer() {
    const userAnswer = normalizeText(answerRef.current);
    const validAnswers = content.correct_answers.map((x) => normalizeText(x));
    return validAnswers.includes(userAnswer);
  }

  function handleChange(value: string) {
    ensureStarted();
    answerRef.current = value;
    setAnswer(value);
  }

  function handleSubmit() {
    if (!answerRef.current.trim()) return;

    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSubmittedRef.current = true;
    hasLoggedRef.current = true;

    const isCorrect = evaluateAnswer();

    onInteraction?.({
      interaction_type: "quiz_attempt",
      started_at: new Date(startedAtRef.current!).toISOString(),
      submitted_at: new Date().toISOString(),
      response: answerRef.current,
      is_correct: isCorrect,
      score: isCorrect ? 1 : 0,
      attempt_number: attemptRef.current,
      metadata: {
        time_spent_ms: getTimeSpent(),
        engagement_mode: "visibility_or_action_based",
      },
    });

    setSubmitted(true);
  }

  function handleSkip() {
    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSkippedRef.current = true;
    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_skip",
      started_at: new Date(startedAtRef.current!).toISOString(),
      submitted_at: new Date().toISOString(),
      response: "",
      is_correct: false,
      score: 0,
      attempt_number: attemptRef.current,
      metadata: {
        time_spent_ms: getTimeSpent(),
        engagement_mode: "visibility_or_action_based",
      },
    });
  }

  function handleRetry() {
    setAnswer("");
    setSubmitted(false);

    answerRef.current = "";
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

    // Use IntersectionObserver + dwell timer to confirm engagement,
    // identical to MultipleChoice. This is the key guard against Strict Mode
    // double-invoking the cleanup and firing a spurious quiz_abandon.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= VISIBILITY_THRESHOLD
        ) {
          if (!dwellTimerRef.current) {
            dwellTimerRef.current = window.setTimeout(() => {
              ensureStarted();
            }, MIN_DWELL_TIME_MS);
          }
        } else {
          if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
          }
        }
      },
      { threshold: VISIBILITY_THRESHOLD }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (dwellTimerRef.current) {
        clearTimeout(dwellTimerRef.current);
      }

      // Only fire abandon if the user actually engaged (dwell or interaction),
      // and hasn't already submitted or skipped.
      if (!engagedRef.current) return;
      if (!startedAtRef.current) return;
      if (hasSubmittedRef.current || hasSkippedRef.current) return;
      if (hasLoggedRef.current) return;

      hasLoggedRef.current = true;

      onInteraction?.({
        interaction_type: "quiz_abandon",
        started_at: new Date(startedAtRef.current).toISOString(),
        engagement_end: new Date().toISOString(),
        response: answerRef.current,
        is_correct: false,
        score: 0,
        attempt_number: attemptRef.current,
        metadata: {
          time_spent_ms: getTimeSpent(),
          engagement_mode: "visibility_or_action_based",
        },
      });
    };
  }, []);

  const isCorrect = submitted && evaluateAnswer();

  return (
    <div ref={containerRef} className="fbq-block">
      {content.title && (
        <h3 className="fbq-title">{content.title}</h3>
      )}

      <p className="fbq-question">{content.question}</p>

      <input
        className="fbq-input"
        value={answer}
        disabled={submitted}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Enter your answer"
      />

      {!submitted ? (
        <div className="fbq-actions">
          <button
            className="fbq-submit"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            Submit
          </button>

          <button className="fbq-skip" onClick={handleSkip}>
            Skip
          </button>
        </div>
      ) : (
        <div className="fbq-feedback">
          <p>{isCorrect ? "✅ Correct" : "❌ Incorrect"}</p>

          {content.explanation && <p>{content.explanation}</p>}

          <button className="fbq-retry" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}