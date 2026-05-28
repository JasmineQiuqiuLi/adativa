"use client";

import { useState, useRef } from "react";
import "./FlashCards.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

type Card = {
  id: string;
  front: string;
  back: string;
};

export type FlashCardsProps = {
  content: Card[];
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const FlashCards = ({ content, onInteraction }: FlashCardsProps) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const cardsSeenRef = useRef<Set<string>>(new Set());
  const revealCountRef = useRef(0);
  const navigationCountRef = useRef(0);

  const card = content[index];

  const noteCardSeen = () => {
    cardsSeenRef.current.add(card.id);
  };

  const handleFlip = () => {
    noteCardSeen();

    if (!flipped) {
      revealCountRef.current += 1;
    }

    setFlipped((f) => !f);
  };

  const handleNext = () => {
    if (index < content.length - 1) {
      noteCardSeen();
      navigationCountRef.current += 1;

      setIndex(index + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      noteCardSeen();
      navigationCountRef.current += 1;

      setIndex(index - 1);
      setFlipped(false);
    }
  };

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "flashcard_session",
      attempt_number: 0,
      metadata: {
        cards_viewed: cardsSeenRef.current.size,
        cards_seen_ids: Array.from(cardsSeenRef.current),
        reveal_count: revealCountRef.current,
        navigation_count: navigationCountRef.current,
      },
    });
  });

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

        <button onClick={handleNext} disabled={index === content.length - 1}>
          →
        </button>
      </div>

      <div className="counter">
        {index + 1} / {content.length}
      </div>
    </div>
  );
};

export default FlashCards;
