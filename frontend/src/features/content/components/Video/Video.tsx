"use client";

import { useEffect,useRef,useState,} from "react";

import "./Video.css";

export type VideoVariant =| "default"| "featured" | "minimal";

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

export type VideoInteraction = {
  interaction_type: "video_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    variant: VideoVariant;

    played: boolean;

    play_count: number;

    watched_duration_seconds: number;

    completed: boolean;

    engagement_mode:
      | "visibility_based";

    visible_duration_ms: number;
  };
};

type VideoProps = {
  content: VideoBlock;

  onInteraction?: (
    interaction: VideoInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 1000;

const Video = ({
  content,
  onInteraction,
}: VideoProps) => {
  const variant =
    content.variant || "default";

  const [hasPlayed, setHasPlayed] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const startedAtRef = useRef<number | null>(
    null
  );

  const dwellTimerRef =
    useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  const playCountRef = useRef(0);

  const watchedDurationRef =
    useRef(0);

  const completedRef =
    useRef(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) return;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >=
              VISIBILITY_THRESHOLD
          ) {
            if (!dwellTimerRef.current) {
              dwellTimerRef.current =
                window.setTimeout(() => {
                  if (
                    !startedAtRef.current
                  ) {
                    startedAtRef.current =
                      Date.now();
                  }
                }, MIN_DWELL_TIME_MS);
            }
          } else {
            if (dwellTimerRef.current) {
              clearTimeout(
                dwellTimerRef.current
              );

              dwellTimerRef.current =
                null;
            }
          }
        },
        {
          threshold:
            VISIBILITY_THRESHOLD,
        }
      );

    observer.observe(node);

    return () => {
      observer.disconnect();

      if (dwellTimerRef.current) {
        clearTimeout(
          dwellTimerRef.current
        );
      }

      if (!startedAtRef.current)
        return;

      if (hasLoggedRef.current)
        return;

      hasLoggedRef.current = true;

      const engagementEnd = Date.now();

      const interaction: VideoInteraction =
        {
          interaction_type:
            "video_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            variant,

            played: hasPlayed,

            play_count:
              playCountRef.current,

            watched_duration_seconds:
              Math.floor(
                watchedDurationRef.current
              ),

            completed:
              completedRef.current,

            engagement_mode:
              "visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current,
          },
        };

      onInteraction?.(interaction);
    };
  }, [ ]);

  const handlePlay = () => {
    setHasPlayed(true);

    playCountRef.current += 1;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    watchedDurationRef.current =
      videoRef.current.currentTime;
  };

  const handleEnded = () => {
    completedRef.current = true;
  };

  return (
    <div
      ref={containerRef}
      className={`video-block ${variant}`}
    >
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
          poster={
            content.thumbnail_url
          }
          onPlay={handlePlay}
          onTimeUpdate={
            handleTimeUpdate
          }
          onEnded={handleEnded}
        >
          <source
            src={content.video_url}
          />
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