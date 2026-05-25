"use client";

import {useEffect,useRef,useMemo} from "react";
import "./CharacterMessage.css";
import { CHARACTERS } from "../../data/characterRegistry";

export type CharacterMessageVariant ="intro"| "tip"| "info"| "warning"| "explanation"| "celebration";

export type CharacterMessageLayout ="left"| "right"| "center";

export type CharacterMessageContent = {
  content_id: string;
  type: "character_message";
  variant: CharacterMessageVariant;
  layout?: CharacterMessageLayout;
  character_name?: string;
  character_avatar?: string;
  headline?: string;
  body: string;
};

export type CharacterMessageInteraction = {
  interaction_type:
    | "character_message_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    engagement_mode:
      | "visibility_based";

    visible_duration_ms: number;

    variant: CharacterMessageVariant;

    layout: CharacterMessageLayout;

    has_avatar: boolean;
  };
};

type CharacterMessageProps = {
  content: CharacterMessageContent;

  onInteraction?: (
    interaction: CharacterMessageInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 1000;

const CharacterMessage = ({
    content,
    onInteraction,
}: CharacterMessageProps) => {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const startedAtRef = useRef<number | null>(
    null
  );

  const dwellTimerRef =
    useRef<number | null>(null);

  const hasLoggedRef = useRef(false);

  const layout =
    content.layout || "left";

  function getRandomCharacter(){

    return CHARACTERS[
        Math.floor(
            Math.random() * CHARACTERS.length
        )
    ];
  }

  const fallbackCharacter = useMemo(
    ()=>getRandomCharacter(),
    []
);

  const resolvedLayout = content.layout ?? "left";

  const characterName = content.character_name ?? fallbackCharacter.name;

  const characterAvatar = content.character_avatar ?? fallbackCharacter.avatar;


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

      const interaction: CharacterMessageInteraction =
        {
          interaction_type:
            "character_message_session",

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

            variant:
              content.variant,

            layout,

            has_avatar:
              !!content.character_avatar,
          },
        };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`character-message-block ${content.variant} ${resolvedLayout}`}
    >
        {characterAvatar && (
        <div className="character-identity">
            <div className="character-avatar-wrapper">
            <img
                src={characterAvatar}
                alt={characterName}
                className="character-avatar"
            />
            </div>

            {characterName && (
            <div className="character-name">
                {characterName}
            </div>
            )}
        </div>
        )}

      <div className="character-message-content">
        {(content.headline) && (
          <div className="character-message-header">
            {content.headline && (
              <div className="character-headline">
                {content.headline}
              </div>
            )}
          </div>
        )}

        <div className="character-body">
          {content.body}
        </div>
      </div>
    </div>
  );
};

export default CharacterMessage;