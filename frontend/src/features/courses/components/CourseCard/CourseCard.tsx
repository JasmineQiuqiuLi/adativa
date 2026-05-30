import "./CourseCard.css";
import type { KeyboardEvent, SyntheticEvent } from "react";

type CourseCardProps = {
  id: number;
  title: string;
  thumbnailUrl?: string | null;
  onClick?: () => void;
  onDelete?: () => void;
};

const FALLBACK_COURSE_THUMBNAILS = [
  "https://cdn.pixabay.com/photo/2021/08/20/16/06/distance-learning-6560788_1280.png",
  "https://cdn.pixabay.com/photo/2022/04/17/21/57/international-7139072_1280.png",
  "https://cdn.pixabay.com/photo/2018/05/18/03/16/online-3410266_1280.jpg",
  "https://cdn.pixabay.com/photo/2021/02/10/08/20/devices-6001296_1280.jpg",
  "https://cdn.pixabay.com/photo/2019/03/31/16/29/online-4091231_1280.jpg",
];

const CourseCard = ({ id, title, thumbnailUrl, onClick, onDelete }: CourseCardProps) => {
  const fallbackThumbnail =
    FALLBACK_COURSE_THUMBNAILS[Math.abs(id) % FALLBACK_COURSE_THUMBNAILS.length];

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onClick?.();
  };

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.src === fallbackThumbnail) return;

    image.src = fallbackThumbnail;
  };

  return (
    <article
      className="course-list-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${title}`}
    >
      <div className="course-card-thumbnail">
        <img
          src={thumbnailUrl || fallbackThumbnail}
          alt=""
          loading="lazy"
          onError={handleImageError}
        />
      </div>

      <div className="course-card-topline">
        <span className="course-card-type">Lesson</span>
        <button
          type="button"
          className="course-card-delete"
          aria-label={`Delete ${title}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        >
          Delete
        </button>
      </div>

      <h3>{title}</h3>
    </article>
  );
};

export default CourseCard;
