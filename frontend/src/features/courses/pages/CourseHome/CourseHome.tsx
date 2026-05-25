
import "./CourseHome.css";
import { useEffect, useState } from "react";
import CourseList from "../../components/CourseList/CourseList";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../auth/hooks/useUser";

type Course={
    id:number;
    title:string;
}

function CourseHome() {
  const navigate=useNavigate()

  const [courses,setCourses]=useState<Course[]>([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string | null>(null)

  const userId = useUser((s)=>s.user?.id);

  const handleCourseClick = (id: number) => {
    navigate(`/skills/${id}`);
  };

  const handleDelete=async (id:number)=>{
    if (!window.confirm("Delete this lesson?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/lessons/${id}`,{
        method:"DELETE"
      })
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (err){
      console.error(err)
      alert("Failed to delete lesson")
    }
  }

  useEffect(()=>{
    if (!userId) return
    async function fetchCourses(){
      try{
        setLoading(true)
        const res=await fetch(`http://127.0.0.1:8000/lessons?user_id=${userId}`)
        const data=await res.json()
        setCourses(data.lessons || []);
      } catch (err) {
        console.error(err)
        setError("Failed to load courses")
      } finally {
        setLoading(false)
      }
    }
    fetchCourses();
  },[userId])

  return (
    <div className="course-home-container">

      <div className="course-home-header">
        <h1>Adaptive Learning Platform</h1>

        <button 
          className="create-btn"
          onClick={()=>navigate("/create-lesson")}
        >
          + Create Course Lesson
        </button>
      </div>

      <div className="course-section">
        <h2>Your Courses</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && courses.length === 0 && (
          <p>No courses yet. Create your first lesson 🚀</p>
        )}

        <CourseList 
          courses={courses}
          onClick={handleCourseClick}
          onDelete={handleDelete}
        />
      </div>

    </div>
  );
}


export default CourseHome;