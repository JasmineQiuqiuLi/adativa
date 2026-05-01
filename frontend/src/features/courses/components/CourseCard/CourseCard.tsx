import './CourseCard.css'


type CourseCardProps ={
    title:string,
    onClick?:()=>void;
};

const CourseCard = ({title, onClick}:CourseCardProps) => {
  return (
    <div className='course-card' onClick={onClick}>
      <h3>{title}</h3>
      <p>Click to open</p>
    </div>
  )
}

export default CourseCard
