"use client";

import { useEffect, useRef, useState } from "react";

import "./RichContent.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

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

type RichContentProps = {
  content: RichContentBlock;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const RichContent = ({content,onInteraction,}: RichContentProps) => {
  const variant = content.variant || "default"
  const [isImageOpen, setIsImageOpen] = useState(false);
  const imageAlt = content.image_alt || "content image";

  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!isImageOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageOpen]);

  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "rich_content_session",
      attempt_number: 0,
      metadata: {
        image_present: !!content.image_url,
        layout: content.layout,
      },
    });
  });

  return (
    <div
      className={`rich-content-block ${content.layout} ${variant}`}
    >
      {content.image_url && (
        <div className="rich-content-image-wrapper">
          <button
            type="button"
            className="rich-content-image-button"
            onClick={() => setIsImageOpen(true)}
            aria-label="Open full image"
          >
            <img
              src={content.image_url}
              alt={imageAlt}
              className="rich-content-image"
            />
          </button>

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

      {content.image_url && isImageOpen && (
        <div
          className="rich-content-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full image preview"
          onClick={() => setIsImageOpen(false)}
        >
          <div
            className="rich-content-lightbox-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="rich-content-lightbox-close"
              onClick={() => setIsImageOpen(false)}
              aria-label="Close full image"
            >
              ×
            </button>

            <img
              src={content.image_url}
              alt={imageAlt}
              className="rich-content-lightbox-image"
            />

            {content.caption && (
              <div className="rich-content-lightbox-caption">
                {content.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichContent;
