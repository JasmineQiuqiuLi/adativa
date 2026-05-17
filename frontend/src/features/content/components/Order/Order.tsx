"use client";

import { useEffect, useRef, useState } from "react";
import "./Order.css";


export type OrderBlock = {
  content_id: string;
  type: "order";
  title?: string;
  question: string;
  items: {
    id: string;    // stable identifier
    text: string;  // display label
  }[];
  // correct_order is the list of item ids in the correct sequence
  correct_order: string[];
};

export type OrderInteraction = {
  interaction_type:
    | "quiz_attempt"
    | "quiz_skip"
    | "quiz_abandon";
  started_at: string;
  submitted_at?: string;
  engagement_end?: string;
  // Serialized as comma-separated item ids in the order the user arranged them
  response: string;
  is_correct: boolean;
  score: number;
  attempt_number: number;
  metadata?: {
    time_spent_ms: number;
    engagement_mode: "visibility_or_action_based";
  };
};

interface OrderProps {
  content: OrderBlock;
  onInteraction?: (interaction: OrderInteraction) => void;
}

const MAX_ATTEMPTS = 3;
const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

function shuffleItems<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function serializeOrder(items: OrderBlock["items"]): string {
  return items.map((item) => item.id).join(",");
}

function evaluateOrder(
  current: OrderBlock["items"],
  correctOrder: string[]
): { score: number; isCorrect: boolean } {
  const correctCount = current.filter(
    (item, index) => item.id === correctOrder[index]
  ).length;
  const score = correctCount / correctOrder.length;
  return { score, isCorrect: score === 1 };
}


export default function Order({ content, onInteraction }: OrderProps) {
  // Shuffle once per mount and keep stable in a ref so retries don't
  // re-randomize (user would lose their current arrangement context).
  const initialOrderRef = useRef(shuffleItems(content.items));

  const [orderedItems, setOrderedItems] = useState(initialOrderRef.current);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Drag state — all in refs, no re-renders needed mid-drag
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const orderedItemsRef = useRef(initialOrderRef.current);
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

  // ─── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    if (submitted || hasSkippedRef.current) return;
    ensureStarted();
    dragIndexRef.current = index;
  }

  function handleDragEnter(index: number) {
    if (submitted || hasSkippedRef.current) return;
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;

    dragOverIndexRef.current = index;

    // Reorder live so the list visually shifts as the user drags
    const updated = [...orderedItemsRef.current];
    const [moved] = updated.splice(dragIndexRef.current, 1);
    updated.splice(index, 0, moved);

    dragIndexRef.current = index;
    dragOverIndexRef.current = null;

    orderedItemsRef.current = updated;
    setOrderedItems(updated);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
  }

  // ─── Submit / skip / retry ────────────────────────────────────────────────

  function handleSubmit() {
    ensureStarted();

    if (hasLoggedRef.current) return;

    hasSubmittedRef.current = true;
    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateOrder(
      orderedItemsRef.current,
      content.correct_order
    );

    onInteraction?.({
      interaction_type: "quiz_attempt",
      started_at: new Date(startedAtRef.current!).toISOString(),
      submitted_at: new Date().toISOString(),
      response: serializeOrder(orderedItemsRef.current),
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
    // Reshuffle on retry so the user gets a fresh arrangement to work from
    const reshuffled = shuffleItems(content.items);
    orderedItemsRef.current = reshuffled;
    setOrderedItems(reshuffled);
    setSubmitted(false);

    attemptRef.current += 1;
    startedAtRef.current = Date.now();
    engagedRef.current = true;
    hasSubmittedRef.current = false;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
  }

  // ─── Engagement / abandon tracking ───────────────────────────────────────

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
        response: serializeOrder(orderedItemsRef.current),
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

  // ─── Derived display state ────────────────────────────────────────────────

  // Build per-item state only after submit so we don't leak correct positions
  // mid-attempt. correctOrderMap is derived fresh each render from props.
  const correctOrderMap = Object.fromEntries(
    content.correct_order.map((id, index) => [id, index])
  );

  function getItemState(
    item: OrderBlock["items"][number],
    index: number
  ): "default" | "dragging" | "correct" | "incorrect" {
    if (!submitted) {
      return dragIndexRef.current === index ? "dragging" : "default";
    }
    if (showAnswer) {
      return item.id === content.correct_order[index] ? "correct" : "incorrect";
    }
    // Mid-attempt: only flag wrong, keep correct ones neutral
    if (item.id !== content.correct_order[index]) return "incorrect";
    return "default";
  }

  return (
    <div ref={containerRef} className="order-block">
      {content.title && (
        <h3 className="order-title">{content.title}</h3>
      )}

      <p className="order-question">{content.question}</p>

      <div className="order-list">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            className={`order-item ${getItemState(item, index)}`}
            draggable={!submitted && !hasSkippedRef.current}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            // Prevent default so onDragEnter fires reliably across browsers
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="order-handle">⠿</span>
            <span className="order-position">{index + 1}</span>
            <span className="order-text">{item.text}</span>

            {/* Reveal correct position on final show-answer phase */}
            {showAnswer && item.id !== content.correct_order[index] && (
              <span className="order-correct-position">
                ✓ position {correctOrderMap[item.id] + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="order-actions">
        <button
          className="order-submit"
          onClick={handleSubmit}
          disabled={submitted}
        >
          Submit
        </button>

        <button
          className="order-skip"
          onClick={handleSkip}
          disabled={hasSkippedRef.current}
        >
          Skip
        </button>

        {submitted && !showAnswer && (
          <button className="order-retry" onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}