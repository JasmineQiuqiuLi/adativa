"use client";

import { useState, useMemo } from "react";
import "./MultipleAnswer.css";

type MCQOption = {
  id: string;
  text: string;
  feedback?: string | null;
};

type MCQMultiContent = {
  content_id: string;
  title: string;
  question: string;
  options: MCQOption[];
  correct_answers: string[];
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

const content: MCQMultiContent = {
  content_id: "1",
  title: "Multiple Answer Question",
  question: "Select ALL correct answers:",
  options: [
    { id: "A", text: "Option A", feedback: "A is correct." },
    { id: "B", text: "Option B", feedback: "B is incorrect." },
    { id: "C", text: "Option C", feedback: "C is correct." },
    { id: "D", text: "Option D", feedback: "D is incorrect." },
  ],
  correct_answers: ["A", "C"],
};

const MAX_ATTEMPTS = 3;

const MultipleAnswer = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [attempt, setAttempt] = useState(1);
    const [showAnswer, setShowAnswer] = useState(false);

    const handleSelect = (id: string) => {
        if (submitted) return;

        setSelected((prev) =>
        prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id]
        );
    };

    const isCorrectSelection = () =>
        selected.length === content.correct_answers.length &&
        selected.every((id) => content.correct_answers.includes(id));

    const buildInteractionResult = (): InteractionResult => {
    const { score, isCorrect } = evaluateMultiAnswer();

    return {
        content_id: content.content_id,
        response: selected.join(","),
        is_correct: isCorrect,
        score,
        attempt,
        evaluation_type: isCorrect ? "local_fast" : "needs_review",
        evaluation_source: "frontend",
    };
    };

    const handleSubmit = () => {
    if (selected.length === 0) return;

    const result = buildInteractionResult();

    console.log("Submitted:", result);

    setSubmitted(true);

    if (result.is_correct || attempt >= MAX_ATTEMPTS) {
        setShowAnswer(true);
    }
    };

    const handleRetry = () => {
        setSelected([]);
        setSubmitted(false);
        setAttempt((prev) => prev + 1);
    };

    const optionStates = useMemo(() => {
        return content.options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        const isCorrect = content.correct_answers.includes(opt.id);

        let state: "default" | "selected" | "correct" | "incorrect" = "default";

        if (submitted) {
            if (showAnswer) {
            if (isCorrect) state = "correct";
            else if (isSelected && !isCorrect) state = "incorrect";
            } else {
            if (isSelected && !isCorrect) state = "incorrect";
            else if (isSelected) state = "selected";
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

    const evaluateMultiAnswer = () => {
        const correctSet = new Set(content.correct_answers);

        const correctSelected = selected.filter(id => correctSet.has(id)).length;
        const incorrectSelected = selected.filter(id => !correctSet.has(id)).length;

        const totalCorrect = content.correct_answers.length;

        let score = (correctSelected - incorrectSelected) / totalCorrect;

        score = Math.max(0, Math.min(1, score));

        const isCorrect = score === 1;

        return { score, isCorrect };
        };

  return (
    <div className="mcq-block">
      <h3 className="mcq-title">{content.title}</h3>

      <p className="mcq-question">{content.question}</p>

      <div className="mcq-options">
        {optionStates.map((opt) => (
          <div
            key={opt.id}
            className={`mcq-option ${opt.state}`}
            onClick={() => handleSelect(opt.id)}
          >
            <div className="mcq-option-main">
              <span className="mcq-checkbox">
                {opt.isSelected ? "☑" : "☐"}
              </span>
              <span className="mcq-label">{opt.id}</span>
              <span className="mcq-option-text">{opt.text}</span>
            </div>

            {/* Selected feedback */}
            {submitted && opt.isSelected && opt.feedback && (
              <div className="mcq-feedback">
                <strong>Explanation:</strong> {opt.feedback}
              </div>
            )}

            {/* Correct answer feedback (only reveal phase) */}
            {submitted &&
              showAnswer &&
              !opt.isSelected &&
              opt.isCorrect &&
              opt.feedback && (
                <div className="mcq-feedback correct-feedback">
                  <strong>Explanation:</strong> {opt.feedback}
                </div>
              )}
          </div>
        ))}
      </div>

      <div className="mcq-actions">
        <button
          className="mcq-submit"
          onClick={handleSubmit}
          disabled={selected.length === 0 || submitted}
        >
          Submit
        </button>

        {submitted &&
          !isCorrectSelection() &&
          !showAnswer && (
            <button className="mcq-retry" onClick={handleRetry}>
              Retry
            </button>
          )}
      </div>
    </div>
  );
};

export default MultipleAnswer;