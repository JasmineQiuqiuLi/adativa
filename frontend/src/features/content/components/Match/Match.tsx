"use client";

import { useRef, useState } from "react";
import "./Match.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


export type MatchBlock = {
  content_id: string;
  type: "match";
  title?: string;
  question: string;
  pairs: {
    id: string;       // unique id for this pair
    prompt: string;   // shown in the left column
    answer: string;   // the correct right-column value
  }[];
};

interface MatchProps {
  content: MatchBlock;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
  onAttemptRetry?: () => void;
}

const MAX_ATTEMPTS = 3;

// The right-column options shown in every dropdown are the shuffled answers.
// We shuffle once at module level so they stay stable across re-renders.
function shuffleAnswers(pairs: MatchBlock["pairs"]): string[] {
  const answers = pairs.map((p) => p.answer);
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return answers;
}

// selections: Record<pairId, chosen answer string | "">
type Selections = Record<string, string>;

function serializeResponse(selections: Selections): string {
  return Object.entries(selections)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
}

function evaluateSelections(
  pairs: MatchBlock["pairs"],
  selections: Selections
): { score: number; isCorrect: boolean } {
  const correctCount = pairs.filter(
    (p) => selections[p.id] === p.answer
  ).length;
  const score = correctCount / pairs.length;
  return { score, isCorrect: score === 1 };
}


export default function Match({ content, onInteraction, onAttemptRetry }: MatchProps) {
  // Shuffle answer options once per mount, kept stable in a ref.
  const shuffledAnswersRef = useRef<string[]>(shuffleAnswers(content.pairs));

  const emptySelections = (): Selections =>
    Object.fromEntries(content.pairs.map((p) => [p.id, ""]));

  const [selections, setSelections] = useState<Selections>(emptySelections);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const selectionsRef = useRef<Selections>(emptySelections());
  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const hasSkippedRef = useRef(false);
  const hasLoggedRef = useRef(false);


  function hasAnySelection(sel: Selections) {
    return Object.values(sel).some((v) => v !== "");
  }

  function handleChange(pairId: string, value: string) {
    if (submitted || hasSkippedRef.current) return;

    interactedRef.current = true;

    const updated = { ...selectionsRef.current, [pairId]: value };
    selectionsRef.current = updated;
    setSelections(updated);
  }

  function handleSubmit() {
    if (!hasAnySelection(selectionsRef.current)) return;

    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateSelections(
      content.pairs,
      selectionsRef.current
    );

    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at: new Date().toISOString(),
      response: serializeResponse(selectionsRef.current),
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

    setSubmitted(true);
    setShowAnswer(true);
  }

  function handleRetry() {
    onAttemptRetry?.();

    const fresh = emptySelections();
    selectionsRef.current = fresh;
    setSelections(fresh);
    setSubmitted(false);

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
      response: serializeResponse(selectionsRef.current),
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  return (
    <div className="match-block">
      {content.title && (
        <h3 className="match-title">{content.title}</h3>
      )}

      <p className="match-question">{content.question}</p>

      <div className="match-pairs">
        {content.pairs.map((pair) => {
          const chosen = selections[pair.id];
          const isCorrectPair = chosen === pair.answer;

          let rowState: "default" | "correct" | "incorrect" = "default";
          if (submitted) {
            if (showAnswer) {
              // Reveal phase: color every row definitively
              rowState = isCorrectPair ? "correct" : "incorrect";
            } else {
              // Mid-attempt feedback: only flag wrong selections, leave
              // correct ones neutral so the user still has to think
              if (chosen !== "" && !isCorrectPair) rowState = "incorrect";
            }
          }

          return (
            <div key={pair.id} className={`match-row ${rowState}`}>
              <span className="match-prompt">{pair.prompt}</span>

              <select
                className="match-select"
                value={chosen}
                disabled={submitted || hasSkippedRef.current}
                onChange={(e) => handleChange(pair.id, e.target.value)}
              >
                <option value="">— select —</option>
                {shuffledAnswersRef.current.map((answer) => (
                  <option key={answer} value={answer}>
                    {answer}
                  </option>
                ))}
              </select>

              {/* Show correct answer on final reveal */}
              {showAnswer && !isCorrectPair && (
                <span className="match-correct-answer">✓ {pair.answer}</span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
      <div className="graded-actions">
        <button
          className="graded-button graded-button--primary"
          onClick={handleSubmit}
          disabled={!hasAnySelection(selections)}
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
      <div className="match-feedback">
        {hasSkippedRef.current ? (
          <p>Skipped</p>
        ) : !showAnswer ? (
          <button
            className="graded-button graded-button--retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        ) : (
          <p>Answer reviewed</p>
        )}
      </div>
      )}
    </div>
  );
}
