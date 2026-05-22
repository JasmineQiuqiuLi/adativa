"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./MultipleAnswer.css";


export type MultipleAnswerBlock = {
  content_id: string;
  type: "multiple_answer";
  title?: string;
  question: string;
  options: {
    id: string;
    text: string;
    feedback?: string | null;
  }[];
  correct_answer_ids: string[];
};

export type MultipleAnswerInteraction = {
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

interface MultipleAnswerProps {
  content: MultipleAnswerBlock;
  onInteraction?: (interaction: MultipleAnswerInteraction) => void;
}

const MAX_ATTEMPTS = 3;
const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;


export default function MultipleAnswer({ content, onInteraction }: MultipleAnswerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<string[]>([]);
  const attemptRef = useRef(1);

  // Bug 4 fix: lazily initialized via ensureStarted(), not at render time,
  // so started_at and time_spent_ms reflect when the user actually engaged.
  const startedAtRef = useRef<number | null>(null);

  const dwellTimerRef = useRef<number | null>(null);

  // Bug 1 fix: engagedRef replaces hasStartedRef as the Strict Mode guard.
  // It is only set true after the IntersectionObserver dwell fires OR on
  // first user interaction — whichever comes first.
  const engagedRef = useRef(false);

  const hasSubmittedRef = useRef(false);
  const hasSkippedRef = useRef(false);

  // Bug 2 fix: hasLoggedRef added to deduplicate all outbound payloads.
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
    if (!startedAtRef.current) return 0;
    return Date.now() - startedAtRef.current;
  }

  function evaluateMultiAnswer() {
    const correctSet = new Set(content.correct_answer_ids);
    const correctSelected = selectedRef.current.filter((id) => correctSet.has(id)).length;
    const incorrectSelected = selectedRef.current.filter((id) => !correctSet.has(id)).length;
    const totalCorrect = content.correct_answer_ids.length;

    const score = Math.max(0, Math.min(1, (correctSelected - incorrectSelected) / totalCorrect));

    return { score, isCorrect: score === 1 };
  }

  function handleSelect(id: string) {
    // Bug 5 fix: ignore clicks after skip (submitted covers post-submit already).
    if (submitted || hasSkippedRef.current) return;

    ensureStarted();

    const updated = selectedRef.current.includes(id)
      ? selectedRef.current.filter((x) => x !== id)
      : [...selectedRef.current, id];

    selectedRef.current = updated;
    setSelected(updated);
  }

  function handleSubmit() {
    if (selectedRef.current.length === 0) return;

    ensureStarted();

    // Bug 2 fix: deduplicate with hasLoggedRef.
    if (hasLoggedRef.current) return;

    hasSubmittedRef.current = true;
    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateMultiAnswer();

    onInteraction?.({
      interaction_type: "quiz_attempt",
      started_at: new Date(startedAtRef.current!).toISOString(),
      submitted_at: new Date().toISOString(),
      response: selectedRef.current.join(","),
      is_correct: isCorrect,
      score,
      attempt_number: attemptRef.current,
      metadata: {
        time_spent_ms: getTimeSpent(),
        engagement_mode: "visibility_or_action_based",
      },
    });

    setSubmitted(true);

    if (isCorrect || attemptRef.current >= MAX_ATTEMPTS) {
      setShowAnswer(true);
    }
  }

  function handleSkip() {
    ensureStarted();

    // Bug 2 fix: deduplicate with hasLoggedRef.
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
    selectedRef.current = [];
    setSelected([]);
    setSubmitted(false);

    attemptRef.current += 1;
    startedAtRef.current = Date.now();

    // Bug 3 & 6 fix: reset ALL tracking flags so the next attempt's abandon
    // can fire correctly and Strict Mode guards aren't bypassed.
    engagedRef.current = true;
    hasSubmittedRef.current = false;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
  }

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Bug 1 fix: IntersectionObserver + dwell timer, identical to MultipleChoice
    // and the refactored FillBlank. The cleanup will only fire quiz_abandon when
    // engagedRef is true, which cannot happen during Strict Mode's synthetic
    // unmount because the dwell timer (1 s) hasn't had time to fire.
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

      if (!engagedRef.current) return;
      if (!startedAtRef.current) return;
      if (hasSubmittedRef.current || hasSkippedRef.current) return;
      if (hasLoggedRef.current) return;

      hasLoggedRef.current = true;

      onInteraction?.({
        interaction_type: "quiz_abandon",
        started_at: new Date(startedAtRef.current).toISOString(),
        engagement_end: new Date().toISOString(),
        response: selectedRef.current.join(","),
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

  const optionStates = useMemo(() => {
    return content.options.map((opt) => {
      const isSelected = selected.includes(opt.id);
      const isCorrect = content.correct_answer_ids.includes(opt.id);

      let state: "default" | "selected" | "correct" | "incorrect" = "default";

      if (submitted) {
        if (showAnswer) {
          if (isCorrect) {
            state = "correct";
          } else if (isSelected) {
            state = "incorrect";
          }
        } else {
          if (isSelected && !isCorrect) {
            state = "incorrect";
          } else if (isSelected) {
            state = "selected";
          }
        }
      } else if (isSelected) {
        state = "selected";
      }

      return { ...opt, isSelected, isCorrect, state };
    });
  }, [selected, submitted, showAnswer]);

  return (
    <div ref={containerRef} className="maq-block">
      {content.title && (
        <h3 className="maq-title">{content.title}</h3>
      )}

      <p className="maq-question">{content.question}</p>

      <div className="maq-options">
        {optionStates.map((opt) => (
          <div
            key={opt.id}
            className={`maq-option ${opt.state}`}
            onClick={() => handleSelect(opt.id)}
          >
            <span>{opt.isSelected ? "☑" : "☐"}</span>
            <span>{opt.text}</span>
          </div>
        ))}
      </div>

      <div className="maq-actions">
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitted}
        >
          Submit
        </button>

        {/* Bug 5 fix: disable Skip after skip has already been recorded */}
        <button
          onClick={handleSkip}
          disabled={hasSkippedRef.current}
        >
          Skip
        </button>

        {submitted && !showAnswer && (
          <button onClick={handleRetry}>Retry</button>
        )}
      </div>
    </div>
  );
}