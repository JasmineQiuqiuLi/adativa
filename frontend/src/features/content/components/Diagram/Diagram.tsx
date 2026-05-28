
"use client";

import { useRef } from "react";

import "./Diagram.css";

import {
  useFinalize,
  type AttemptPayload,
} from "../EngagementWrapper/EngagementWrapper";

export type DiagramVariant =
  | "flow"
  | "timeline"
  | "hierarchy"
  | "comparison";

export type DiagramNode = {
  id: string;
  title: string;
  description?: string;
};

export type ComparisonColumn = {
  title: string;
  items: string[];
};

export type DiagramBlock = {
  content_id: string;

  type: "diagram";

  variant: DiagramVariant;

  title?: string;

  nodes?: DiagramNode[];

  comparison_columns?: ComparisonColumn[];
};

type DiagramProps = {
  content: DiagramBlock;

  onInteraction?: (payload: AttemptPayload) => void | Promise<void>;
};

const Diagram = ({
  content,
  onInteraction,
}: DiagramProps) => {

  const hasLoggedRef = useRef(false);
  useFinalize(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;
    onInteraction?.({
      interaction_type: "diagram_session",
      attempt_number: 0,
      metadata: {
        variant: content.variant,
        node_count: content.nodes?.length || 0,
      },
    });
  });

  const renderFlow = () => {
    return (
      <div className="diagram-flow">
        {content.nodes?.map(
          (node, idx) => (
            <>
              <div key={node.id} className="diagram-node">
                <div className="diagram-node-title">
                  {node.title}
                </div>

                {node.description && (
                  <div className="diagram-node-description">
                    {node.description}
                  </div>
                )}
              </div>


              {idx !==
                content.nodes!.length -
                  1 && (
                <div className="diagram-arrow">
                  →
                </div>
              )}
            </>
          )
        )}
      </div>
    );
  };

  const renderTimeline = () => {
    return (
      <div className="diagram-timeline">
        {content.nodes?.map((node) => (
          <div
            key={node.id}
            className="timeline-item"
          >
            <div className="timeline-dot" />

            <div className="timeline-content">
              <div className="diagram-node-title">
                {node.title}
              </div>

              {node.description && (
                <div className="diagram-node-description">
                  {node.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHierarchy = () => {
    return (
      <div className="diagram-hierarchy">
        {content.nodes?.map((node) => (
          <div
            key={node.id}
            className="diagram-node"
          >
            <div className="diagram-node-title">
              {node.title}
            </div>

            {node.description && (
              <div className="diagram-node-description">
                {node.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  const renderComparison = () => {
    return (
      <div className="diagram-comparison">
        {content.comparison_columns?.map(
          (column) => (
            <div
              key={column.title}
              className="comparison-column"
            >
              <div className="comparison-title">
                {column.title}
              </div>

              <ul className="comparison-list">
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>
    );
  };

  const renderDiagram = () => {
    switch (content.variant) {
      case "flow":
        return renderFlow();

      case "timeline":
        return renderTimeline();

      case "hierarchy":
        return renderHierarchy();

      case "comparison":
        return renderComparison();

      default:
        return null;
    }
  };

  return (
    <div
      className={`diagram-block ${content.variant}`}
    >
      {content.title && (
        <h3 className="diagram-title">
          {content.title}
        </h3>
      )}

      {renderDiagram()}
    </div>
  );
};

export default Diagram;
