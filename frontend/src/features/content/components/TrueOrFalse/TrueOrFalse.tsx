"use client";

import { useState, useMemo } from "react";
import "./TrueOrFalse.css";

type TFOption = {
  id: "true" | "false";
  text: string;
  feedback?: string | null;
};

type TFContent = {
  content_id: string;
  title: string;
  question: string;
  options: TFOption[];
  correct_answer: "true" | "false";
};

type InteractionResult = {
  content_id: string;
  response: string;
  is_correct: boolean;
  score: number;
  attempt: number;
  evaluation_type: "local_fast" | "needs_review";
  evaluation_source: "frontend";
};

const content: TFContent = {
  content_id: "tf1",
  title: "True or False",
  question: "Yeast is responsible for making dough rise.",
  options: [
    { id: "true", text: "True", feedback: "Correct — yeast produces CO₂." },
    { id: "false", text: "False", feedback: "Incorrect — yeast is essential." },
  ],
  correct_answer: "true",
};

const MAX_ATTEMPTS = 2;

const TrueOrFalse = () => {
  const [selected, setSelected] = useState<"true" | "false" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSelect = (id: "true" | "false") => {
    if (submitted) return;
    setSelected(id);
  };

  const evaluate = () => {
    const isCorrect = selected === content.correct_answer;
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
    };
  };

  const handleSubmit = () => {
    if (!selected) return;

    const { isCorrect, score } = evaluate();

    const result: InteractionResult = {
      content_id: content.content_id,
      response: selected,
      is_correct: isCorrect,
      score,
      attempt,
      evaluation_type: isCorrect ? "local_fast" : "needs_review",
      evaluation_source: "frontend",
    };

    console.log("Submitted:", result);

    setSubmitted(true);

    if (isCorrect || attempt >= MAX_ATTEMPTS) {
      setShowAnswer(true);
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
    setAttempt((prev) => prev + 1);
  };

  const optionStates = useMemo(() => {
    return content.options.map((opt) => {
      const isSelected = selected === opt.id;
      const isCorrect = opt.id === content.correct_answer;

      let state: "default" | "selected" | "correct" | "incorrect" = "default";

      if (submitted) {
        if (showAnswer) {
          if (isCorrect) state = "correct";
          else if (isSelected) state = "incorrect";
        } else {
          if (isSelected) state = "incorrect";
        }
      } else if (isSelected) {
        state = "selected";
      }

      return {
        ...opt,
        isSelected,
        isCorrect,
        state,
      };
    });
  }, [selected, submitted, showAnswer]);

  return (
    <div className="tf-block">
      <h3 className="tf-title">{content.title}</h3>

      <p className="tf-question">{content.question}</p>

      <div className="tf-options">
        {optionStates.map((opt) => (
          <div
            key={opt.id}
            className={`tf-option ${opt.state}`}
            onClick={() => handleSelect(opt.id)}
          >
            <div className="tf-option-main">
              <span className="tf-label">{opt.text}</span>
            </div>

            {/* Selected feedback */}
            {submitted && opt.isSelected && opt.feedback && (
              <div className="tf-feedback">
                <strong>Explanation:</strong> {opt.feedback}
              </div>
            )}

            {/* Correct feedback (only reveal phase) */}
            {submitted &&
              showAnswer &&
              !opt.isSelected &&
              opt.isCorrect &&
              opt.feedback && (
                <div className="tf-feedback correct-feedback">
                  <strong>Explanation:</strong> {opt.feedback}
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="tf-actions">
        <button
          className="tf-submit"
          onClick={handleSubmit}
          disabled={!selected || submitted}
        >
          Submit
        </button>

        {submitted &&
          selected !== content.correct_answer &&
          !showAnswer && (
            <button className="tf-retry" onClick={handleRetry}>
              Retry
            </button>
          )}
      </div>
    </div>
  );
};

export default TrueOrFalse;