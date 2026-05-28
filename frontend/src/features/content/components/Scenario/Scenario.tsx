"use client";

import { useRef, useState } from "react";
import "./Scenario.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

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

type ScenarioProps = {
  content: ScenarioBlock;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Scenario = ({ content, onInteraction }: ScenarioProps) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  const selectedChoicesRef = useRef<string[]>([]);
  const viewedConsequencesRef = useRef<Set<string>>(new Set());
  const changedSelectionCountRef = useRef(0);

  const handleChoiceSelect = (choiceId: string) => {
    if (selectedChoiceId && selectedChoiceId !== choiceId) {
      changedSelectionCountRef.current += 1;
    }

    setSelectedChoiceId(choiceId);

    selectedChoicesRef.current.push(choiceId);

    viewedConsequencesRef.current.add(choiceId);
  };

  const selectedChoice = content.choices.find(
    (choice) => choice.id === selectedChoiceId
  );

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "scenario_session",
      attempt_number: 0,
      metadata: {
        selected_choice_ids: selectedChoicesRef.current,
        viewed_consequences: Array.from(viewedConsequencesRef.current),
        changed_selection_count: changedSelectionCountRef.current,
        explored_all_choices:
          viewedConsequencesRef.current.size === content.choices.length,
      },
    });
  });

  return (
    <div className="scenario-block">
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
          const active = selectedChoiceId === choice.id;

          return (
            <button
              key={choice.id}
              className={`scenario-choice ${active ? "active" : ""}`}
              onClick={() => handleChoiceSelect(choice.id)}
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
            {selectedChoice.consequence}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scenario;
