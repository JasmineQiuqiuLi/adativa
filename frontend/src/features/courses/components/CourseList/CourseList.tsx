import CourseCard from "../CourseCard/CourseCard";
import "./CourseList.css"

type Course={
    id:number;
    title:string;
    thumbnailUrl?: string | null;
}

type Props ={
    courses:Course[];
    onClick?: (id: number) => void;
    onDelete?: (id: number) => void;
}

const CourseList = ({courses,onClick,onDelete}:Props) => {

  return (
    <div className="course-list-grid">
        {
            courses.map((course)=>(
                <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    thumbnailUrl={course.thumbnailUrl}
                    onClick={()=>onClick?.(course.id)}
                    onDelete={()=>onDelete?.(course.id)}
                />
            ))
        }
      
    </div>
  )
}

export default CourseList
