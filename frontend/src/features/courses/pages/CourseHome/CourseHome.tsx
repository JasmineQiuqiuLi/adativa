import "./CourseHome.css";
import { useEffect, useState } from "react";
import CourseList from "../../components/CourseList/CourseList";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../auth/hooks/useUser";

type Course = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
};

const SKELETON_CARDS = Array.from({ length: 6 });

function CourseHome() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useUser((s) => s.user?.id);

  const handleCourseClick = (id: number) => {
    navigate(`/skills/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this lesson?")) return;

    try {
      await fetch(`http://127.0.0.1:8000/lessons/${id}`, {
        method: "DELETE",
      });
      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete lesson");
    }
  };

  useEffect(() => {
    if (!userId) return;

    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://127.0.0.1:8000/lessons?user_id=${userId}`);
        const data = await res.json();
        setCourses(data.lessons || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [userId]);

  return (
    <main className="course-home-container">
      <div className="course-home-shell">
        <section className="course-home-header">
          <div>
            <p className="course-home-eyebrow">Learning workspace</p>
            <h1>Adaptive Learning Platform</h1>
            <p className="course-home-subtitle">
              Pick up an existing lesson or create a new adaptive learning path.
            </p>
          </div>

          <button
            className="course-home-create-btn"
            onClick={() => navigate("/create-lesson")}
          >
            Create lesson
          </button>
        </section>

        <section className="course-section">
          <div className="course-section-header">
            <div>
              <h2>Your courses</h2>
              <p>Continue from your saved lessons and skill maps.</p>
            </div>
          </div>

          {loading && (
            <div className="course-home-skeleton-grid" aria-label="Loading courses">
              {SKELETON_CARDS.map((_, index) => (
                <div className="course-home-skeleton-card" key={index}>
                  <div className="course-home-skeleton-line wide" />
                  <div className="course-home-skeleton-line" />
                  <div className="course-home-skeleton-footer" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="course-home-state course-home-error" role="alert">
              <h3>Courses could not load</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="course-home-state course-home-empty">
              <h3>No lessons yet</h3>
              <p>Create your first lesson to generate objectives, skills, and adaptive content.</p>
              <button
                className="course-home-secondary-btn"
                onClick={() => navigate("/create-lesson")}
              >
                Create first lesson
              </button>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <CourseList
              courses={courses}
              onClick={handleCourseClick}
              onDelete={handleDelete}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default CourseHome;
