"use client";

import { useEffect, useRef, useState } from "react";
import "./Game.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

type InteractionResult = {
  response: string;
  is_correct: boolean;
  score: number;
  metadata?: any;
};


type GameProps = {
  content: string; //htmlContent
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
  onAttemptRetry?: () => void;
};

const MAX_ATTEMPTS = 2;
const CORRECT_RULE = 0.8;

const Game = ({
  content,
  onInteraction,
  onAttemptRetry,
}: GameProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [attempt, setAttempt] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  const attemptRef = useRef(1);
  const interactedRef = useRef(false);
  const resultRef = useRef<InteractionResult | null>(null);
  const hasLoggedRef = useRef(false);

  // mark activity (start tracking)
  const markActivity = () => {
    interactedRef.current = true;
  };

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  // Listen to iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (!data || data.type !== "GAME_RESULT") return;

      markActivity();

      const { total_tasks, correct, metadata } = data.payload || {};
      const score = correct / total_tasks;
      if (typeof score !== "number") return;

      const interaction: InteractionResult = {
        response: "game_play",
        is_correct: score >= CORRECT_RULE,
        score,
        metadata,
      };

      resultRef.current = interaction;

      console.log("Game result (raw):", interaction);

      setResult(interaction);
      setSubmitted(true);

      hasLoggedRef.current = true;

      onInteraction?.({
        interaction_type: "game_result",
        submitted_at: new Date().toISOString(),
        response: "game_play",
        is_correct: interaction.is_correct,
        score: interaction.score,
        attempt_number: attemptRef.current,
        metadata: interaction.metadata,
      });
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [attempt]);

  // unmount + pagehide: emit game_session if user interacted but no result was captured
  useFinalize(() => {
    if (!interactedRef.current) return;
    if (hasLoggedRef.current) return;

    hasLoggedRef.current = true;

    onInteraction?.({
      interaction_type: "game_session",
      response: "game_play",
      is_correct: null,
      score: null,
      attempt_number: 0,
      metadata: { status: "abandoned" },
    });
  });

  // Retry logic
  const handleRetry = () => {
    onAttemptRetry?.();

    setAttempt((prev) => prev + 1);
    setSubmitted(false);
    setResult(null);

    resultRef.current = null;
    hasLoggedRef.current = false;
    interactedRef.current = false;
  };

  return (
    <div
      className="game-block"
      onClick={markActivity} //  start tracking
    >
      <h3 className="game-title">Interactive Game</h3>

      <iframe
        key={attempt}
        ref={iframeRef}
        className="game-iframe"
        sandbox="allow-scripts"
        srcDoc={content}
        title="Game"
      />

      {submitted && result && (
        <div className="game-result">
          <p>
            Score: {(result.score * 100).toFixed(0)}%
          </p>
          <p>
            Status:{" "}
            {result.is_correct
              ? "Correct ✅"
              : "Try Again ❌"}
          </p>
        </div>
      )}

      <div className="game-actions">
        {submitted && attempt < MAX_ATTEMPTS && (
          <button
            className="graded-button graded-button--retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default Game;
