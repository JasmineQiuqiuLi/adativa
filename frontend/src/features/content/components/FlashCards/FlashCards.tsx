"use client";

import { useState, useRef, useEffect } from "react";
import "./FlashCards.css";

type Card = {
  id: string;
  front: string;
  back: string;
};

export type FlashCardsInteraction={
  interaction_type:string;
  started_at:string;
  engagement_end:string;
  metadata?:any;
}

export type FlashCardsProps={
  cards:Card[];
  onInteraction?:(interaction:FlashCardsInteraction)=>void;
}

const FlashCards = ({cards,onInteraction}:FlashCardsProps) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // 🧠 tracking refs
  const startedAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number | null>(null);

  const cardsSeenRef = useRef<Set<string>>(new Set());
  const revealCountRef = useRef(0);
  const navigationCountRef = useRef(0);

  const card = cards[index];

  // 🔥 helper: mark activity
  const markActivity = () => {
    const now = Date.now();

    if (!startedAtRef.current) {
      startedAtRef.current = now;
    }

    lastActivityRef.current = now;

    // track card seen
    cardsSeenRef.current.add(card.id);
  };

  // 🔥 flip card (reveal)
  const handleFlip = () => {
    markActivity();

    if (!flipped) {
      revealCountRef.current += 1;
    }

    setFlipped((f) => !f);
  };

  // 🔥 next
  const handleNext = () => {
    if (index < cards.length - 1) {
      markActivity();
      navigationCountRef.current += 1;

      setIndex(index + 1);
      setFlipped(false);
    }
  };

  // 🔥 prev
  const handlePrev = () => {
    if (index > 0) {
      markActivity();
      navigationCountRef.current += 1;

      setIndex(index - 1);
      setFlipped(false);
    }
  };

  // 🔥 finalize interaction on unmount
  useEffect(() => {
    return () => {
      if (!startedAtRef.current) return;

      const engagementEnd = lastActivityRef.current || Date.now();

      const interaction = {
        interaction_type: "flashcard_session",

        started_at: new Date(startedAtRef.current).toISOString(),
        // submitted_at: null,
        engagement_end: new Date(engagementEnd).toISOString(),

        metadata: {
          cards_viewed: cardsSeenRef.current.size,
          cards_seen_ids: Array.from(cardsSeenRef.current),
          reveal_count: revealCountRef.current,
          navigation_count: navigationCountRef.current,
        }
      };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div className="flashcard-block">
      <h3 className="flashcard-title">Flashcards</h3>

      <div className="flashcard-row">
        <button onClick={handlePrev} disabled={index === 0}>
          ←
        </button>

        <div className="deck">
          <div className="ghost ghost-1" />
          <div className="ghost ghost-2" />

          <div className="card" onClick={handleFlip}>
            <div className={`card-inner ${flipped ? "flipped" : ""}`}>
              <div className="card-front">{card.front}</div>
              <div className="card-back">{card.back}</div>
            </div>
          </div>
        </div>

        <button onClick={handleNext} disabled={index === cards.length - 1}>
          →
        </button>
      </div>

      <div className="counter">
        {index + 1} / {cards.length}
      </div>
    </div>
  );
};

export default FlashCards;