"use client";

import { useEffect, useRef, useState } from "react";
import "./Game.css";
// import { gameHTML } from "./fakeGame";
// import './fakeGameHTML'

type InteractionResult = {
  content_id: string;
  response: string;
  is_correct: boolean;
  score: number;
  attempt: number;
  evaluation_type: "local_fast" | "needs_review";
  evaluation_source: "frontend";
  metadata?: any;
};

type GameProps = {
  htmlContent: string;
};

const MAX_ATTEMPTS = 2;

const Game = ({htmlContent}:GameProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [attempt, setAttempt] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  // 🎯 Listen to iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (!data || data.type !== "GAME_RESULT") return;

      const { score, is_correct, metadata } = data.payload || {};

      // basic validation
      if (typeof score !== "number") return;

      const interaction: InteractionResult = {
        content_id: "game_1",
        response: "game_play",
        is_correct: is_correct ?? score >= 0.8,
        score,
        attempt,
        evaluation_type:
          score === 1 ? "local_fast" : "needs_review",
        evaluation_source: "frontend",
        metadata,
      };

      console.log("Game result:", interaction);

      setResult(interaction);
      setSubmitted(true);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [attempt]);

  // 🔁 Retry logic
    const handleRetry = () => {
    setAttempt(prev => prev + 1);
    setSubmitted(false);
    setResult(null);
    };

  return (
    <div className="game-block">
      <h3 className="game-title">Interactive Game</h3>

      <iframe
        key={attempt}
        ref={iframeRef}
        className="game-iframe"
        sandbox="allow-scripts"
        srcDoc={htmlContent}
        title="Game"
      />

      {submitted && result && (
        <div className="game-result">
          <p>Score: {(result.score * 100).toFixed(0)}%</p>
          <p>
            Status: {result.is_correct ? "Correct ✅" : "Try Again ❌"}
          </p>
        </div>
      )}

      <div className="game-actions">
        {submitted && attempt < MAX_ATTEMPTS && (
          <button className="game-retry" onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default Game;