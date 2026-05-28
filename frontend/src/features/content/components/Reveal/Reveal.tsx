"use client";

import { useRef, useState } from "react";

import "./Reveal.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

export type RevealBlock = {
  content_id: string;
  type: "reveal";
  headline?: string;
  prompt: string;
  revealed_content: string;
  button_label?: string;
};

type RevealProps = {
  content: RevealBlock;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Reveal = ({
  content,
  onInteraction,
}: RevealProps) => {
  const [revealed, setRevealed] = useState(false);

  const revealCountRef = useRef(0);
  const revealedRef = useRef(false);

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "reveal_session",
      attempt_number: 0,
      metadata: {
        revealed: revealedRef.current,
        reveal_count: revealCountRef.current,
      },
    });
  });

  const handleReveal = () => {
    if (!revealed) {
      revealCountRef.current += 1;
    }

    setRevealed((prev) => {
      const next = !prev;
      revealedRef.current = next;
      return next;
    });
  };

  return (
    <div className="reveal-block">
      {content.headline && (
        <h3 className="reveal-headline">
          {content.headline}
        </h3>
      )}

      <div className="reveal-prompt">
        {content.prompt}
      </div>

      <button
        className="reveal-button"
        onClick={handleReveal}
      >
        {revealed
          ? "Hide"
          : content.button_label ||
            "Reveal"}
      </button>

      {revealed && (
        <div className="reveal-content">
          {content.revealed_content}
        </div>
      )}
    </div>
  );
};

export default Reveal;
