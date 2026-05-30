import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./LessonNavigation.css";
import type { LessonProgress } from "../../api";

type Skill = {
  skillId: number;
  name: string;
};

type Objective = {
  objectiveId: number;
  orderIndex: number;
  title: string;
  description: string;
  skills: Skill[];
  generatedModes?: string[];
  hasGeneratedContent?: boolean;
};

type ObjectiveState = "completed" | "current" | "selected" | "upcoming";

type LessonNavigationProps = {
  currentObjectiveId: number | null;
  selectedObjectiveId: number | null;
  progress: LessonProgress | null;
  onObjectiveSelect?: (objectiveId: number) => void;
};

function getObjectiveState(
  objectiveId: number,
  currentObjectiveId: number | null,
  selectedObjectiveId: number | null,
  progress: LessonProgress | null
): ObjectiveState {
  const objectiveProgress = progress?.objectives.find(
    (objective) => objective.objective_id === objectiveId
  );

  if (objectiveId === currentObjectiveId) {
    return "current";
  }

  if (objectiveId === selectedObjectiveId) {
    return "selected";
  }

  if (objectiveProgress?.status === "completed") {
    return "completed";
  }

  return "upcoming";
}

const LessonNavigation = ({
  currentObjectiveId,
  selectedObjectiveId,
  progress,
  onObjectiveSelect,
}: LessonNavigationProps) => {
  const { lessonId } = useParams<{ lessonId: string }>();

  const [collapsed, setCollapsed] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchObjectives() {
      if (!lessonId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `http://127.0.0.1:8000/lessons/${lessonId}/objectives-with-skills`
        );
        const data = await res.json();
        setObjectives(data.objectives || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load learning plan");
      } finally {
        setLoading(false);
      }
    }

    fetchObjectives();
  }, [lessonId, progress]);

  return (
    <aside className={`lesson-nav-panel ${collapsed ? "collapsed" : ""}`}>
      <button
        className="panel-toggle left-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? ">" : "<"}
      </button>

      {!collapsed && (
        <div className="lesson-nav-content">
          <h3>Learning Plan</h3>

          {loading && <p className="nav-status">Loading...</p>}

          {error && <p className="nav-error">{error}</p>}

          {!loading && !error && objectives.length === 0 && (
            <p className="nav-status">No objectives found.</p>
          )}

          {!loading &&
            !error &&
            objectives
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((objective) => {
                const state = getObjectiveState(
                  objective.objectiveId,
                  currentObjectiveId,
                  selectedObjectiveId,
                  progress
                );
                const canOpen =
                  objective.objectiveId === currentObjectiveId ||
                  state === "completed" ||
                  Boolean(objective.generatedModes?.includes("initial"));

                return (
                  <button
                    key={objective.objectiveId}
                    type="button"
                    className={[
                      "nav-objective",
                      `nav-objective--${state}`,
                      canOpen
                        ? "nav-objective--clickable"
                        : "nav-objective--locked",
                    ].join(" ")}
                    onClick={() => {
                      if (canOpen) {
                        onObjectiveSelect?.(objective.objectiveId);
                      }
                    }}
                    disabled={!canOpen}
                  >
                    <p className="nav-objective-title">
                      <span className="nav-objective-indicator">
                        {state === "completed" && "✓"}
                        {state === "current" && "●"}
                        {state === "selected" && "◐"}
                        {state === "upcoming" && "○"}
                      </span>

                      {objective.orderIndex}. {objective.title}
                    </p>

                    <p className="nav-objective-desc">
                      {objective.description}
                    </p>

                    <ul>
                      {objective.skills.map((skill) => (
                        <li key={skill.skillId}>{skill.name}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
        </div>
      )}
    </aside>
  );
};

export default LessonNavigation;
