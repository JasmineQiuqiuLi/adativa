"use client";

import {useEffect,useRef,useState,} from "react";
import "./Scenario.css";

export type ScenarioChoice = {
  id: string;
  label: string;
  consequence: string;
};

export type ScenarioBlock = {
  content_id: string;
  type: "scenario";
  title?: string;
  scenario: string;
  choices: ScenarioChoice[];
};

export type ScenarioInteraction = {
  interaction_type: "scenario_session";
  started_at: string;
  engagement_end: string;
  metadata: {
    selected_choice_ids: string[];
    viewed_consequences: string[];
    changed_selection_count: number;
    explored_all_choices: boolean;
    engagement_mode: "visibility_based";
    visible_duration_ms: number;
  };
};

type ScenarioProps = {
  content: ScenarioBlock;
  onInteraction?: (
    interaction: ScenarioInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_TIME_MS = 1000;

const Scenario = ({content,onInteraction}: ScenarioProps) => {
  const [selectedChoiceId, setSelectedChoiceId] =useState<string | null>(null);
  const containerRef =useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const dwellTimerRef =useRef<number | null>(null);
  const hasLoggedRef = useRef(false);
  const selectedChoicesRef = useRef<string[]>([]);
  const viewedConsequencesRef = useRef< Set<string>>(new Set());

  const changedSelectionCountRef = useRef(0);

  const handleChoiceSelect = (choiceId: string) => {
    if (
      selectedChoiceId && selectedChoiceId !== choiceId
    ) {
      changedSelectionCountRef.current += 1;
    }

    setSelectedChoiceId(choiceId);

    selectedChoicesRef.current.push(
      choiceId
    );

    viewedConsequencesRef.current.add(
      choiceId
    );
  };

  const selectedChoice =
    content.choices.find(
      (choice) =>
        choice.id === selectedChoiceId
    );

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

      const interaction: ScenarioInteraction =
        {
          interaction_type:
            "scenario_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            selected_choice_ids:
              selectedChoicesRef.current,

            viewed_consequences:
              Array.from(
                viewedConsequencesRef.current
              ),

            changed_selection_count:
              changedSelectionCountRef.current,

            explored_all_choices:
              viewedConsequencesRef
                .current.size ===
              content.choices.length,

            engagement_mode:
              "visibility_based",

            visible_duration_ms:
              engagementEnd -
              startedAtRef.current,
          },
        };

      onInteraction?.(interaction);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="scenario-block"
    >
      {content.title && (
        <h3 className="scenario-title">
          {content.title}
        </h3>
      )}

      <div className="scenario-description">
        {content.scenario}
      </div>

      <div className="scenario-choices">
        {content.choices.map((choice) => {
          const active =
            selectedChoiceId ===
            choice.id;

          return (
            <button
              key={choice.id}
              className={`scenario-choice ${active ? "active" : ""}`}
              onClick={() =>
                handleChoiceSelect(
                  choice.id
                )
              }
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {selectedChoice && (
        <div className="scenario-consequence">
          <div className="scenario-consequence-label">
            Outcome
          </div>

          <div className="scenario-consequence-content">
            {
              selectedChoice.consequence
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default Scenario;