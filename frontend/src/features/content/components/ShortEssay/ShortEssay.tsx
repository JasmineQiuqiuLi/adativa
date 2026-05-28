"use client";

import { useRef, useState } from "react";
import "./ShortEssay.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


export type ShortEssayBlock = {
  content_id: string;
  type: "short_essay";
  title?: string;
  question: string;
  // Optional rubric hint shown to the user so they know what's being graded on
  rubric_hint?: string;
};

export type GradingStatus = "pending" | "complete" | "failed";

export type GradeResult = {
  is_correct: boolean; // whether the answer is correct based on the rubric
  score: number;        // 0–1
  feedback: string;     // shown to the user and included in quiz_grade payload
};

interface ShortEssayProps {
  content: ShortEssayBlock;
  // Parent owns the AI call so it can inject its own model, prompt, auth, etc.
  gradeAnswer: (response: string) => Promise<GradeResult>;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
}

// A score of 0.6 or above is considered correct — adjust to taste.
const CORRECT_THRESHOLD = 0.6;


export default function ShortEssay({
  content,
  gradeAnswer,
  onInteraction,
}: ShortEssayProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gradingStatus, setGradingStatus] = useState<GradingStatus | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  const answerRef = useRef("");
  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const hasSkippedRef = useRef(false);
  const hasLoggedRef = useRef(false);
  // Tracks the in-flight grade promise so a stale response from a previous
  // attempt can be discarded if the user somehow triggers a new one.
  const gradeAttemptRef = useRef(0);


  function handleChange(value: string) {
    if (submitted || hasSkippedRef.current) return;
    interactedRef.current = true;
    answerRef.current = value;
    setAnswer(value);
  }

  async function handleSubmit() {
    if (!answerRef.current.trim()) return;

    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const submittedAt = new Date().toISOString();

    // ── Step 1: fire optimistic quiz_attempt immediately ──────────────────
    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at: submittedAt,
      response: answerRef.current,
      is_correct: null,
      score: null,
      grading_status: "pending",
      attempt_number: attemptRef.current,
    });

    setSubmitted(true);
    setGradingStatus("pending");

    // ── Step 2: call parent grader async, then fire quiz_grade ────────────
    const thisAttempt = ++gradeAttemptRef.current;
    const responseSnapshot = answerRef.current;

    try {
      const result = await gradeAnswer(responseSnapshot);

      // Discard if a newer attempt has superseded this one (safety net)
      if (gradeAttemptRef.current !== thisAttempt) return;

      const isCorrect = result.score >= CORRECT_THRESHOLD;

      onInteraction?.({
        interaction_type: "quiz_grade",
        submitted_at: submittedAt,
        graded_at: new Date().toISOString(),
        response: responseSnapshot,
        is_correct: isCorrect,
        score: result.score,
        grading_status: "complete",
        grading_feedback: result.feedback,
        attempt_number: attemptRef.current,
      });

      setGradeResult(result);
      setGradingStatus("complete");
    } catch {
      if (gradeAttemptRef.current !== thisAttempt) return;

      onInteraction?.({
        interaction_type: "quiz_grade",
        submitted_at: submittedAt,
        graded_at: new Date().toISOString(),
        response: responseSnapshot,
        is_correct: null,
        score: null,
        grading_status: "failed",
        attempt_number: attemptRef.current,
      });

      setGradingStatus("failed");
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
      is_correct: null,
      score: null,
      attempt_number: 0,
      metadata: { status: "skipped" },
    });
  }

  // ShortAnswer intentionally has no Retry — each attempt is an independent
  // open-ended response and AI grading cost makes unlimited retries unsuitable.
  // If retries are needed in future, add MAX_ATTEMPTS gating here.

  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_abandon",
      response: answerRef.current,
      is_correct: null,
      score: null,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  // ── Derived display ────────────────────────────────────────────────────────

  const isCorrect =
    gradingStatus === "complete" && gradeResult !== null
      ? gradeResult.score >= CORRECT_THRESHOLD
      : null;

  return (
    <div className="saq-block">
      {content.title && (
        <h3 className="saq-title">{content.title}</h3>
      )}

      <p className="saq-question">{content.question}</p>

      {content.rubric_hint && (
        <p className="saq-rubric-hint">{content.rubric_hint}</p>
      )}

      <textarea
        className="saq-input"
        value={answer}
        disabled={submitted}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your answer here…"
        rows={4}
      />

      {!submitted ? (
        <div className="saq-actions">
          <button
            className="saq-submit"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            Submit
          </button>

          <button
            className="saq-skip"
            onClick={handleSkip}
            disabled={hasSkippedRef.current}
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="saq-feedback">
          {gradingStatus === "pending" && (
            <p className="saq-grading">⏳ Grading your answer…</p>
          )}

          {gradingStatus === "complete" && gradeResult !== null && (
            <>
              <p className="saq-result">
                {isCorrect ? "✅ Correct" : "❌ Incorrect"}
                <span className="saq-score">
                  {" "}({Math.round(gradeResult.score * 100)}%)
                </span>
              </p>
              <p className="saq-feedback-text">{gradeResult.feedback}</p>
            </>
          )}

          {gradingStatus === "failed" && (
            <p className="saq-error">
              ⚠️ Grading is unavailable right now. Your response has been recorded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
