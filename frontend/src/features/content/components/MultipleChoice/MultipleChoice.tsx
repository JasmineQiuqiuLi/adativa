"use client";

import { useState, useMemo } from "react";
import "./MultipleChoice.css";

type MCQOption = {
  id: string;
  text: string;
  feedback?:string|null
};

type MCQContent = {
  content_id: string;
  title: string;
  question: string;
  options: MCQOption[];
  correct_answer: string; // MUST match option.id
};

type InteractionResult = {
  content_id: string;
  response: string;
  is_correct: boolean;
  score: number;
  attempt:number;
  evaluation_type: "local_fast" | "needs_review";
  evaluation_source: "frontend";
};

const content: MCQContent = {
  content_id: "1",
  title: "Multiple Choice Question",
  question: "What is the correct answer?",
  options: [
    { id: "A", text: "Option A",feedback:"This is the feedback for option A. This is a very long feedback.This is a very long feedback.This is a very long feedback" },
    { id: "B", text: "Option B",feedback:"this is option feedback B" },
    { id: "C", text: "Option C",feedback:"this is option feedback C" },
    { id: "D", text: "Option D",feedback:"this is option feedback D" },
  ],
  correct_answer: "A",
};

const MultipleChoice = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(1);   // ✅ NEW
  const [showAnswer, setShowAnswer] = useState(false); // control reveal
 
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
            if (isSelected) state = "incorrect"; // only mark selected
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

    const handleSubmit = () => {
    if (!selected) return;

    const isCorrect = selected === content.correct_answer;

    const result: InteractionResult = {
        content_id: content.content_id,
        response: selected,
        is_correct: isCorrect,
        score: isCorrect ? 1 : 0,
        attempt,
        evaluation_type: isCorrect ? "local_fast" : "needs_review",
        evaluation_source: "frontend",
    };

    console.log("Submitted:", result);

    setSubmitted(true);

    if (isCorrect) {
        setShowAnswer(true); // correct → reveal
    }
    };

    const handleRetry = () => {
        setSelected(null);
        setSubmitted(false);
        setAttempt((prev) => prev + 1);
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
        onClick={() => !submitted && setSelected(opt.id)}
        >
        <div className="mcq-option-main">
            <span className="mcq-label">{opt.id}</span>
            <span className="mcq-option-text">{opt.text}</span>
        </div>

        {submitted && opt.isSelected && opt.feedback && (
            <div className="mcq-feedback">
            <strong>Explanation:</strong> {opt.feedback}
            </div>
        )}

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
        disabled={!selected || submitted}
    >
        Submit
    </button>

    {submitted && selected !== content.correct_answer && (
        <button className="mcq-retry" onClick={handleRetry}>
        Retry
        </button>
    )}
    </div>
  </div>
);
}

export default MultipleChoice;