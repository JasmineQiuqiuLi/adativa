import { useParams } from 'react-router-dom'

const CourseDetail = () => {
  const {courseId}=useParams()

  return (
    <div style={{padding:"2rem"}}>
      <h1>Course Details</h1>
      <p>Course ID: {courseId}</p>
    </div>
  )
}

export default CourseDetail
