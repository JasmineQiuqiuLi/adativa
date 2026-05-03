import CourseCard from "../CourseCard/CourseCard";
import "./CourseList.css"

type Course={
    id:number;
    title:string;
}

type Props ={
    courses:Course[];
    onClick?: (id: number) => void;
    onDelete?: (id: number) => void;
}

const CourseList = ({courses,onClick,onDelete}:Props) => {

  return (
    <div className="course-grid">
        {
            courses.map((course)=>(
                <CourseCard
                    key={course.id}
                    title={course.title}
                    onClick={()=>onClick?.(course.id)}
                    onDelete={()=>onDelete?.(course.id)}
                />
            ))
        }
      
    </div>
  )
}

export default CourseList
