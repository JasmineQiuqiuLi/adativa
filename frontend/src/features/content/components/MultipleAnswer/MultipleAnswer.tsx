"use client";

import { useMemo, useRef, useState } from "react";
import "./MultipleAnswer.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


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

interface MultipleAnswerProps {
  content: MultipleAnswerBlock;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
  onAttemptRetry?: () => void;
}

const MAX_ATTEMPTS = 3;


export default function MultipleAnswer({ content, onInteraction, onAttemptRetry }: MultipleAnswerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const selectedRef = useRef<string[]>([]);
  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const hasSkippedRef = useRef(false);
  const hasLoggedRef = useRef(false);


  function evaluateMultiAnswer() {
    const correctSet = new Set(content.correct_answer_ids);
    const correctSelected = selectedRef.current.filter((id) => correctSet.has(id)).length;
    const incorrectSelected = selectedRef.current.filter((id) => !correctSet.has(id)).length;
    const totalCorrect = content.correct_answer_ids.length;

    const score = Math.max(0, Math.min(1, (correctSelected - incorrectSelected) / totalCorrect));

    return { score, isCorrect: score === 1 };
  }

  function handleSelect(id: string) {
    if (submitted || hasSkippedRef.current) return;

    interactedRef.current = true;

    const updated = selectedRef.current.includes(id)
      ? selectedRef.current.filter((x) => x !== id)
      : [...selectedRef.current, id];

    selectedRef.current = updated;
    setSelected(updated);
  }

  function handleSubmit() {
    if (selectedRef.current.length === 0) return;

    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateMultiAnswer();

    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at: new Date().toISOString(),
      response: selectedRef.current.join(","),
      is_correct: isCorrect,
      score,
      attempt_number: attemptRef.current,
    });

    setSubmitted(true);

    if (isCorrect || attemptRef.current >= MAX_ATTEMPTS) {
      setShowAnswer(true);
    }
  }

  function handleSkip() {
    interactedRef.current = true;

    if (hasLoggedRef.current) return;

    hasSkippedRef.current = true;
    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_skip",
      submitted_at: new Date().toISOString(),
      response: "",
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "skipped" },
    });

    setSkipped(true);
    setSubmitted(true);
    setShowAnswer(true);
  }

  function handleRetry() {
    onAttemptRetry?.();

    selectedRef.current = [];
    setSelected([]);
    setSubmitted(false);
    setSkipped(false);

    attemptRef.current += 1;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
    interactedRef.current = false;
  }

  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_abandon",
      response: selectedRef.current.join(","),
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

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
    <div className="maq-block">
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

      {!submitted ? (
        <div className="graded-actions">
          <button
            className="graded-button graded-button--primary"
            onClick={handleSubmit}
            disabled={selected.length === 0}
          >
            Submit
          </button>

          <button
            className="graded-button graded-button--secondary"
            onClick={handleSkip}
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="maq-feedback">
          <p>{skipped ? "Skipped" : showAnswer ? "Answer reviewed" : "Try again"}</p>
          {!showAnswer && (
            <button
              className="graded-button graded-button--retry"
              onClick={handleRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
