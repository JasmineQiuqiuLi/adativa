import {createBrowserRouter} from "react-router-dom"
import CourseHome from "../features/courses/pages/CourseHome/CourseHome"
import CourseDetail from "../features/courses/pages/CourseDetail/CourseDetail";
import CreateLesson from "../features/courses/pages/CreateLesson/CreateLesson";
import ObjectivesReviewWrapper from "../features/courses/pages/ReviewObjective/ObjectiveReviewWrapper";

export const router = createBrowserRouter([
    {
        path:"/",
        element:<CourseHome/>,
    },
    {
        path:"/course/:courseId",
        element: <CourseDetail />
    },
    {
        path:"/create-lesson",
        element:<CreateLesson/>
    },
    {
        path:"objectives-review",
        element:<ObjectivesReviewWrapper/>
    }
]);