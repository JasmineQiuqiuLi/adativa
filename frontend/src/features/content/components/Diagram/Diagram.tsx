
"use client";

import {
  useEffect,
  useRef,
} from "react";

import "./Diagram.css";

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

export type DiagramInteraction = {
  interaction_type: "diagram_session";

  started_at: string;

  engagement_end: string;

  metadata: {
    variant: DiagramVariant;

    node_count: number;

    engagement_mode: "visibility_based";

    visible_duration_ms: number;
  };
};

type DiagramProps = {
  content: DiagramBlock;

  onInteraction?: (
    interaction: DiagramInteraction
  ) => void;
};

const VISIBILITY_THRESHOLD = 0.5;

const MIN_DWELL_TIME_MS = 1000;

const Diagram = ({
  content,
  onInteraction,
}: DiagramProps) => {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const startedAtRef = useRef<number | null>(
    null
  );

  const dwellTimerRef =
    useRef<number | null>(null);

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

      const interaction: DiagramInteraction =
        {
          interaction_type:
            "diagram_session",

          started_at: new Date(
            startedAtRef.current
          ).toISOString(),

          engagement_end: new Date(
            engagementEnd
          ).toISOString(),

          metadata: {
            variant: content.variant,

            node_count:
              content.nodes?.length || 0,

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
      ref={containerRef}
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






