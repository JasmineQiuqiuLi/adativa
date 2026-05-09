"use client";

import {
  useEffect,
  useRef,
} from "react";

import "./RichContent.css";

export type RichContentLayout = "text"| "image_top" | "image_left"| "image_right"| "hero";
export type RichContentVariant= "default" | "quote"| "statement" | "definition"| "summary";

export type RichContentBlock = {
  content_id: string;
  type: "rich_content";
  variant?: RichContentVariant;
  layout: RichContentLayout;
  headline?: string;
  body?: string;
  image_url?: string;
  image_alt?: string;
  caption?: string;
};

export type RichContentInteraction = {
  interaction_type: "rich_content_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    engagement_mode: "visibility_based";

    visible_duration_ms: number;

    image_present: boolean;

    layout: RichContentLayout;
  };
};

type RichContentProps = {
  content: RichContentBlock;

  onInteraction?: (
    interaction: RichContentInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 1000;

const RichContent = ({content,onInteraction,}: RichContentProps) => {
  const variant = content.variant || "default"
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>( null );

  const dwellTimerRef = useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

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

      const interaction: RichContentInteraction =
        {
          interaction_type:
            "rich_content_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            engagement_mode:
              "visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current,

            image_present:
              !!content.image_url,

            layout: content.layout,
          },
        };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rich-content-block ${content.layout} ${variant}`}
    >
      {content.image_url && (
        <div className="rich-content-image-wrapper">
          <img
            src={content.image_url}
            alt={
              content.image_alt ||
              "content image"
            }
            className="rich-content-image"
          />

          {content.caption && (
            <div className="rich-content-caption">
              {content.caption}
            </div>
          )}
        </div>
      )}

      <div className="rich-content-text">
        {content.headline && (
          <h2 className="rich-content-headline">
            {content.headline}
          </h2>
        )}

        {content.body && (
          <div className="rich-content-body">
            {content.body}
          </div>
        )}
      </div>
    </div>
  );
};

export default RichContent;