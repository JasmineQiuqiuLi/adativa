import './CourseCard.css'


type CourseCardProps ={
    title:string,
    onClick?:()=>void;
    onDelete?:()=>void;
};

const CourseCard = ({title,onClick,onDelete}:CourseCardProps) => {
  return (
    <div className='course-card' onClick={onClick}>
      <h3>{title}</h3>
      <button
        className='delete-btn'
        onClick={(e)=>{
          e.stopPropagation(); //prevent from triggering card click
          onDelete?.()
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default CourseCard
