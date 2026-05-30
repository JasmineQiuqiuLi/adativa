"use client";

import { useRef, useState } from "react";
import "./MultipleChoice.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


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

interface MultipleChoiceProps {
  content: MCQBlock;
  onInteraction?: (
    payload: AttemptPayload
  ) => void | Promise<void>;
  onAttemptRetry?: () => void;
}

export default function MultipleChoice({content,onInteraction,onAttemptRetry,}: MultipleChoiceProps) {
  const [selectedId, setSelectedId] =useState("");

  const [submitted, setSubmitted] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const selectedIdRef = useRef("");

  const attemptRef = useRef(1);

  const interactedRef = useRef(false);

  const hasLoggedRef = useRef(false);

  function calculateScore(isCorrect: boolean) {
    return isCorrect ? 1 : 0;
  }

  function handleSelect(optionId: string) {
    interactedRef.current = true;

    selectedIdRef.current = optionId;

    setSelectedId(optionId);
  }

  function handleSubmit() {
    if (!selectedIdRef.current) return;

    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const isCorrect =  selectedIdRef.current === content.correct_answer_id;

    setSubmitted(true);

    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at:  new Date().toISOString(),
      response: selectedIdRef.current,
      is_correct: isCorrect,
      score: calculateScore(isCorrect),
      attempt_number: attemptRef.current,
    });
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
    // Flush the previous attempt's engagement window (PATCH happens parent-side)
    // so each attempt ends up with its own engagement_end/active_duration.
    onAttemptRetry?.();

    setSelectedId("");
    setSubmitted(false);
    setSkipped(false);

    selectedIdRef.current = "";

    attemptRef.current += 1;

    hasLoggedRef.current = false;
    // After retry the abandon path becomes available again only if the user
    // touches the new attempt, so interactedRef resets too.
    interactedRef.current = false;
  }

  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_abandon",
      response: selectedIdRef.current,
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  const isCorrect = selectedId === content.correct_answer_id;

return (
  <div className="mcq-block">
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

      <div className="graded-actions" >
        <button
          className="graded-button graded-button--primary"
          onClick={handleSubmit}
          disabled={!selectedId}
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

      <div className="mcq-feedback-global"
      >
        <p>
          {skipped ? "Skipped" : isCorrect ? "Correct" : "Incorrect"}
        </p>

        {content.explanation && (
          <p>
            {content.explanation}
          </p>
        )}

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
