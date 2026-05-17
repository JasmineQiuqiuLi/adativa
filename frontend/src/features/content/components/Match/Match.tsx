"use client";

import { useEffect, useRef, useState } from "react";
import "./Match.css";


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

export type MatchInteraction = {
  interaction_type:
    | "quiz_attempt"
    | "quiz_skip"
    | "quiz_abandon";
  started_at: string;
  submitted_at?: string;
  engagement_end?: string;
  // Serialized as "promptId:answerId,promptId:answerId,..." for each pair the
  // user matched. Empty string when nothing was selected (skip / early abandon).
  response: string;
  is_correct: boolean;
  score: number;
  attempt_number: number;
  metadata?: {
    time_spent_ms: number;
    engagement_mode: "visibility_or_action_based";
  };
};

interface MatchProps {
  content: MatchBlock;
  onInteraction?: (interaction: MatchInteraction) => void;
}

const MAX_ATTEMPTS = 3;
const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

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


export default function Match({ content, onInteraction }: MatchProps) {
  // Shuffle answer options once per mount, kept stable in a ref.
  const shuffledAnswersRef = useRef<string[]>(shuffleAnswers(content.pairs));

  const emptySelections = (): Selections =>
    Object.fromEntries(content.pairs.map((p) => [p.id, ""]));

  const [selections, setSelections] = useState<Selections>(emptySelections);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectionsRef = useRef<Selections>(emptySelections());
  const attemptRef = useRef(1);
  const startedAtRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const engagedRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const hasSkippedRef = useRef(false);
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

  function hasAnySelection(sel: Selections) {
    return Object.values(sel).some((v) => v !== "");
  }

  function handleChange(pairId: string, value: string) {
    if (submitted || hasSkippedRef.current) return;

    ensureStarted();

    const updated = { ...selectionsRef.current, [pairId]: value };
    selectionsRef.current = updated;
    setSelections(updated);
  }

  function handleSubmit() {
    if (!hasAnySelection(selectionsRef.current)) return;

    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSubmittedRef.current = true;
    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateSelections(
      content.pairs,
      selectionsRef.current
    );

    onInteraction?.({
      interaction_type: "quiz_attempt",
      started_at: new Date(startedAtRef.current!).toISOString(),
      submitted_at: new Date().toISOString(),
      response: serializeResponse(selectionsRef.current),
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
    const fresh = emptySelections();
    selectionsRef.current = fresh;
    setSelections(fresh);
    setSubmitted(false);

    attemptRef.current += 1;
    startedAtRef.current = Date.now();
    // engagedRef stays true — the user is actively retrying
    engagedRef.current = true;
    hasSubmittedRef.current = false;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
  }

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

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
        response: serializeResponse(selectionsRef.current),
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

  return (
    <div ref={containerRef} className="match-block">
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

      <div className="match-actions">
        <button
          className="match-submit"
          onClick={handleSubmit}
          disabled={!hasAnySelection(selections) || submitted}
        >
          Submit
        </button>

        <button
          className="match-skip"
          onClick={handleSkip}
          disabled={hasSkippedRef.current}
        >
          Skip
        </button>

        {submitted && !showAnswer && (
          <button className="match-retry" onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}