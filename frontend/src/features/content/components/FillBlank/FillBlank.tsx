"use client";

import { useRef, useState } from "react";
import "./FillBlank.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


export type FillBlankBlock = {
  content_id: string;
  type: "fill_blank";
  title?: string;
  question: string;
  correct_answers: string[];
  case_sensitive?: boolean;
  explanation?: string;
};

interface FillBlankProps {
  content: FillBlankBlock;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
  onAttemptRetry?: () => void;
}

export default function FillBlank({ content, onInteraction, onAttemptRetry }: FillBlankProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const answerRef = useRef("");
  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const hasLoggedRef = useRef(false);

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
    interactedRef.current = true;
    answerRef.current = value;
    setAnswer(value);
  }

  function handleSubmit() {
    if (!answerRef.current.trim()) return;

    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const isCorrect = evaluateAnswer();

    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at: new Date().toISOString(),
      response: answerRef.current,
      is_correct: isCorrect,
      score: isCorrect ? 1 : 0,
      attempt_number: attemptRef.current,
    });

    setSubmitted(true);
  }

  function handleSkip() {
    interactedRef.current = true;

    if (hasLoggedRef.current) return;

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
  }

  function handleRetry() {
    onAttemptRetry?.();

    setAnswer("");
    setSubmitted(false);
    setSkipped(false);

    answerRef.current = "";
    attemptRef.current += 1;
    hasLoggedRef.current = false;
    interactedRef.current = false;
  }

  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_abandon",
      response: answerRef.current,
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  const isCorrect = submitted && evaluateAnswer();

  return (
    <div className="fbq-block">
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
        <div className="graded-actions">
          <button
            className="graded-button graded-button--primary"
            onClick={handleSubmit}
            disabled={!answer.trim()}
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
        <div className="fbq-feedback">
          <p>{skipped ? "Skipped" : isCorrect ? "Correct" : "Incorrect"}</p>

          {content.explanation && <p>{content.explanation}</p>}

          {!skipped && (
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
