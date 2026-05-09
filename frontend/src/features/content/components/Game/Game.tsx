"use client";

import { useEffect, useRef, useState } from "react";
import "./Game.css";

type InteractionResult = {
  response: string;
  is_correct: boolean;
  score: number;
  metadata?: any;
};

export type GameInteraction={
  interaction_type:"game_result"|"game_session";

  started_at:string;
  submitted_at?:string;
  engagement_end:string;

  response:string;

  is_correct?:boolean|null;
  score?:number|null;

  attempt_number:number;

  metadata?:any;

}


type GameProps = {
  htmlContent: string;
  onInteraction?:(interaction: GameInteraction)=>void;
};

const MAX_ATTEMPTS = 2;
const CORRECT_RULE = 0.8;

const Game = ({
  htmlContent,
  onInteraction
}: GameProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [attempt, setAttempt] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  // lifecycle tracking
  const attemptRef = useRef(1);
  const startedAtRef = useRef<number | null>(null);
  const submittedAtRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number | null>(null);
  const resultRef = useRef<any>(null);

  // mark activity (start tracking)
  const markActivity = () => {
    const now = Date.now();

    if (!startedAtRef.current) {
      startedAtRef.current = now;
    }

    lastActivityRef.current = now;
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

      const { total_tasks,correct, metadata } = data.payload || {};
      const score=correct/total_tasks
      if (typeof score !== "number") return;

      // submitted moment
      submittedAtRef.current = Date.now();

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
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [attempt]);

  // finalize interaction (IMPORTANT)
  const finalize = () => {
    if (!startedAtRef.current) return;

    const engagementEnd =
      lastActivityRef.current || Date.now();

    const interaction:GameInteraction = {
      interaction_type: resultRef.current
        ? "game_result"
        : "game_session",

      started_at: new Date(
        startedAtRef.current
      ).toISOString(),

      ...(submittedAtRef.current && {
        submitted_at: new Date(
          submittedAtRef.current
        ).toISOString(),
      }),

      engagement_end: new Date(
        engagementEnd
      ).toISOString(),

      response: "game_play",

      is_correct: resultRef.current?.is_correct ?? null,
      score: resultRef.current?.score ?? null,
      attempt_number: attemptRef.current,

      metadata: resultRef.current?.metadata ?? null,
    };

    onInteraction?.(interaction);
  };

  // unmount tracking
  useEffect(() => {
    return () => finalize();
  }, []);

  // Retry logic
  const handleRetry = () => {

    finalize(); 

    setAttempt((prev) => prev + 1);
    setSubmitted(false);
    setResult(null);

    // reset tracking
    startedAtRef.current = null;
    submittedAtRef.current = null;
    lastActivityRef.current = null;
    resultRef.current = null;
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
        srcDoc={htmlContent}
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
            className="game-retry"
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