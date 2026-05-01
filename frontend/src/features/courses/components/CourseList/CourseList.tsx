import CourseCard from "../CourseCard/CourseCard";
import "./CourseList.css"
import { useNavigate } from "react-router-dom";

type Course={
    id:number;
    title:string;
}

type Props ={
    courses:Course[]
}

const CourseList = ({courses}:Props) => {
  const navigate=useNavigate()
  return (
    <div className="course-grid">
        {
            courses.map((course)=>(
                <CourseCard
                    key={course.id}
                    title={course.title}
                    onClick={()=>navigate(`/course/${course.id}`)}
                />
            ))
        }
      
    </div>
  )
}

export default CourseList
