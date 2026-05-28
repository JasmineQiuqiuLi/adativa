"use client";

import { useMemo, useRef } from "react";
import "./CharacterMessage.css";
import { CHARACTERS } from "../../data/characterRegistry";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

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

type CharacterMessageProps = {
  content: CharacterMessageContent;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const CharacterMessage = ({
    content,
    onInteraction,
}: CharacterMessageProps) => {
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


  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "character_message_session",
      attempt_number: 0,
      metadata: {
        variant: content.variant,
        layout,
        has_avatar: !!content.character_avatar,
      },
    });
  });

  return (
    <div
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
