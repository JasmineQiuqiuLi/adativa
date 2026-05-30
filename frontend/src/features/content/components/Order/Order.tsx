"use client";

import { useRef, useState } from "react";
import "./Order.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";


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
  correct_order_ids: string[];
};

interface OrderProps {
  content: OrderBlock;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
  onAttemptRetry?: () => void;
}

const MAX_ATTEMPTS = 3;

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


export default function Order({ content, onInteraction, onAttemptRetry }: OrderProps) {
  // Shuffle once per mount and keep stable in a ref so retries don't
  // re-randomize (user would lose their current arrangement context).
  const initialOrderRef = useRef(shuffleItems(content.items));

  const [orderedItems, setOrderedItems] = useState(initialOrderRef.current);
  const [submitted, setSubmitted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Drag state — all in refs, no re-renders needed mid-drag
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const orderedItemsRef = useRef(initialOrderRef.current);
  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const hasSkippedRef = useRef(false);
  const hasLoggedRef = useRef(false);


  // ─── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    if (submitted || hasSkippedRef.current) return;
    interactedRef.current = true;
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
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    const { score, isCorrect } = evaluateOrder(
      orderedItemsRef.current,
      content.correct_order_ids
    );

    onInteraction?.({
      interaction_type: "quiz_attempt",
      submitted_at: new Date().toISOString(),
      response: serializeOrder(orderedItemsRef.current),
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

    // Reshuffle on retry so the user gets a fresh arrangement to work from
    const reshuffled = shuffleItems(content.items);
    orderedItemsRef.current = reshuffled;
    setOrderedItems(reshuffled);
    setSubmitted(false);

    attemptRef.current += 1;
    hasSkippedRef.current = false;
    hasLoggedRef.current = false;
    interactedRef.current = false;
  }

  // ─── Abandon tracking ─────────────────────────────────────────────────────

  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "quiz_abandon",
      response: serializeOrder(orderedItemsRef.current),
      is_correct: false,
      score: 0,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  // ─── Derived display state ────────────────────────────────────────────────

  // Build per-item state only after submit so we don't leak correct positions
  // mid-attempt. correctOrderMap is derived fresh each render from props.
  const correctOrderMap = Object.fromEntries(
    content.correct_order_ids.map((id, index) => [id, index])
  );

  function getItemState(
    item: OrderBlock["items"][number],
    index: number
  ): "default" | "dragging" | "correct" | "incorrect" {
    if (!submitted) {
      return dragIndexRef.current === index ? "dragging" : "default";
    }
    if (showAnswer) {
      return item.id === content.correct_order_ids[index] ? "correct" : "incorrect";
    }
    // Mid-attempt: only flag wrong, keep correct ones neutral
    if (item.id !== content.correct_order_ids[index]) return "incorrect";
    return "default";
  }

  return (
    <div className="order-block">
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
            {showAnswer && item.id !== content.correct_order_ids[index] && (
              <span className="order-correct-position">
                ✓ position {correctOrderMap[item.id] + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
      <div className="graded-actions">
        <button
          className="graded-button graded-button--primary"
          onClick={handleSubmit}
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
      <div className="order-feedback">
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
