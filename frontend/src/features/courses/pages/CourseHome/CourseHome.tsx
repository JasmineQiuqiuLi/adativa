
import "./CourseHome.css";
import { useState } from "react";
import CourseList from "../../components/CourseList/CourseList";
import { useNavigate } from "react-router-dom";

type Course={
    id:number;
    title:string;
}

function CourseHome() {
  const navigate=useNavigate()
  const [courses]=useState<Course []>([
    {id:1,title:"Intro to AI"},
    {id:2,title:"Machine Learning Basics"}
  ])

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
        <CourseList courses={courses}/>
      </div>

    </div>
  );
}


export default CourseHome;