"use client";

import { useRef } from "react";

import "./Video.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

export type VideoVariant = | "default" | "featured" | "minimal";

export type VideoBlock = {
  content_id: string;
  type: "video";
  variant?: VideoVariant;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
};

type VideoProps = {
  content: VideoBlock;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Video = ({
  content,
  onInteraction,
}: VideoProps) => {
  const variant = content.variant || "default";

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playCountRef = useRef(0);
  const watchedDurationRef = useRef(0);
  const completedRef = useRef(false);
  const hasPlayedRef = useRef(false);

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "video_session",
      attempt_number: 0,
      metadata: {
        variant,
        played: hasPlayedRef.current,
        play_count: playCountRef.current,
        watched_duration_seconds: Math.floor(watchedDurationRef.current),
        completed: completedRef.current,
      },
    });
  });

  const handlePlay = () => {
    hasPlayedRef.current = true;
    playCountRef.current += 1;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    watchedDurationRef.current = videoRef.current.currentTime;
  };

  const handleEnded = () => {
    completedRef.current = true;
  };

  return (
    <div className={`video-block ${variant}`}>
      {content.title && (
        <h3 className="video-title">
          {content.title}
        </h3>
      )}

      {content.description && (
        <div className="video-description">
          {content.description}
        </div>
      )}

      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="video-player"
          controls
          poster={content.thumbnail_url}
          onPlay={handlePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        >
          <source src={content.video_url} />
        </video>
      </div>

      {content.caption && (
        <div className="video-caption">
          {content.caption}
        </div>
      )}
    </div>
  );
};

export default Video;
