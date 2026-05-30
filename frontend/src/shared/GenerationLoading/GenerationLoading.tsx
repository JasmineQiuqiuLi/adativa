import { useEffect, useMemo, useState } from "react";
import "./GenerationLoading.css";

type GenerationVariant = "objectives" | "skills" | "content";
type ContentMode = "initial" | "remedial" | "advance";

type GenerationLoadingProps = {
  variant: GenerationVariant;
  mode?: ContentMode;
};

const COPY: Record<
  GenerationVariant,
  {
    eyebrow: string;
    title: string;
    description: string;
    messages: string[];
  }
> = {
  objectives: {
    eyebrow: "Learning path",
    title: "Drafting your objectives",
    description: "We are turning your goal into a clear sequence of learning steps.",
    messages: [
      "Reading your learning goal",
      "Breaking it into a learning path",
      "Balancing scope and pace",
      "Preparing objectives for review",
    ],
  },
  skills: {
    eyebrow: "Skill map",
    title: "Mapping measurable skills",
    description: "We are connecting each objective to the skills you will practice.",
    messages: [
      "Finding measurable skills",
      "Connecting skills to each objective",
      "Preparing the learning map",
      "Organizing skills for review",
    ],
  },
  content: {
    eyebrow: "Lesson content",
    title: "Composing learning blocks",
    description: "This can take a little longer for richer activities.",
    messages: [
      "Choosing the best block types",
      "Writing explanations and examples",
      "Preparing checks for understanding",
      "Adding visuals when available",
    ],
  },
};

const CONTENT_MODE_TITLES: Record<ContentMode, string> = {
  initial: "Building your first activity set",
  remedial: "Creating targeted practice",
  advance: "Preparing a challenge",
};

const SKELETON_COUNTS: Record<GenerationVariant, number> = {
  objectives: 4,
  skills: 3,
  content: 3,
};

function GenerationLoading({
  variant,
  mode = "initial",
}: GenerationLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  const copy = useMemo(() => {
    const base = COPY[variant];
    if (variant !== "content") return base;

    return {
      ...base,
      title: CONTENT_MODE_TITLES[mode],
    };
  }, [variant, mode]);

  useEffect(() => {
    setMessageIndex(0);
    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % copy.messages.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [copy.messages.length, variant, mode]);

  return (
    <section className={`generation-loading generation-loading--${variant}`}>
      <div className="generation-loading-header">
        <span className="generation-loading-eyebrow">
          {copy.eyebrow}
        </span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="generation-loading-track" aria-hidden="true">
        <span />
      </div>

      <div className="generation-loading-status" aria-live="polite">
        <span className="generation-loading-dot" aria-hidden="true" />
        {copy.messages[messageIndex]}
      </div>

      <div className="generation-loading-preview" aria-hidden="true">
        {Array.from({ length: SKELETON_COUNTS[variant] }).map((_, index) => (
          <div
            key={index}
            className={`generation-skeleton generation-skeleton--${variant}`}
          >
            {variant === "objectives" && (
              <>
                <span className="skeleton-badge" />
                <div className="skeleton-lines">
                  <span className="skeleton-line skeleton-line--wide" />
                  <span className="skeleton-line skeleton-line--medium" />
                </div>
              </>
            )}

            {variant === "skills" && (
              <>
                <div className="skeleton-lines">
                  <span className="skeleton-line skeleton-line--wide" />
                  <span className="skeleton-line skeleton-line--medium" />
                </div>
                <div className="skeleton-chip-row">
                  <span className="skeleton-chip" />
                  <span className="skeleton-chip" />
                  <span className="skeleton-chip skeleton-chip--short" />
                </div>
              </>
            )}

            {variant === "content" && (
              <>
                <span className="skeleton-line skeleton-line--wide" />
                <span className="skeleton-line skeleton-line--medium" />
                <span className="skeleton-line skeleton-line--short" />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default GenerationLoading;
