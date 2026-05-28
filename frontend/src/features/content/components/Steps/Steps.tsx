"use client";

import { useRef } from "react";

import "./Steps.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

export type StepItem = {
  id: string;
  title: string;
  content: string;
};

export type StepsContent = {
  content_id: string;
  type: string;
  title: string;
  steps: StepItem[];
};

type StepsProps = {
  content: StepsContent;
  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Steps = ({
  content,
  onInteraction,
}: StepsProps) => {

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "steps_session",
      attempt_number: 0,
      metadata: {
        steps_viewed: content.steps.length,
        viewed_step_ids: content.steps.map((step) => step.id),
        completed: true,
      },
    });
  });

  return (
    <div className="steps-block">
      <div className="steps-header">
        <h3 className="steps-title">
          {content.title}
        </h3>
      </div>

      <div className="steps-list">
        {content.steps.map(
          (step, idx) => (
            <div
              key={step.id}
              className="steps-item"
            >
              <div className="steps-item-left">
                <div className="steps-circle">
                  {idx + 1}
                </div>

                {idx !==
                  content.steps.length -
                    1 && (
                  <div className="steps-line" />
                )}
              </div>

              <div className="steps-item-content">
                <div className="steps-step-title">
                  {step.title}
                </div>

                <div className="steps-content">
                  {step.content}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Steps;
