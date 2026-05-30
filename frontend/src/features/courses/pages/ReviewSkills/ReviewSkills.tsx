import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GenerationLoading from "../../../../shared/GenerationLoading/GenerationLoading";
import "./ReviewSkills.css";

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
};

const ReviewSkills = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;

    setLoading(true);
    setError(null);

    fetch(`http://127.0.0.1:8000/lessons/${lessonId}/objectives-with-skills`)
      .then((res) => res.json())
      .then((data) => setObjectives(data.objectives))
      .catch((err) => {
        console.error(err);
        setError("Failed to load skills");
      })
      .finally(() => setLoading(false));
  }, [lessonId]);

  return (
    <div className="skills-container">
      <div className="skills-header">
        <h2>Skills Breakdown</h2>
        <p>
          Each objective is supported by measurable skills. These skills will
          guide learning activities and assessments.
        </p>
      </div>

      {loading && <GenerationLoading variant="skills" />}

      {error && <div className="error-box">{error}</div>}

      {!loading && (
        <div className="objectives-wrapper">
          {objectives.map((obj) => (
            <div key={obj.objectiveId} className="objective-card">
              <div className="objective-top">
                <span className="objective-index">{obj.orderIndex}</span>
                <div>
                  <p className="objective-title">{obj.title}</p>
                  <p className="objective-desc">{obj.description}</p>
                </div>
              </div>

              <div className="skills-section">
                {obj.skills.map((skill) => (
                  <span key={skill.skillId} className="skill-tag">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <button
          className="start-learning-btn"
          onClick={() => navigate(`/learn/${lessonId}`)}
        >
          Start Learning
        </button>
      )}
    </div>
  );
};

export default ReviewSkills;
