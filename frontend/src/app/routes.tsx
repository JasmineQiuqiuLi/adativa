import {createBrowserRouter} from "react-router-dom"
import CourseHome from "../features/courses/pages/CourseHome/CourseHome"
import CourseDetail from "../features/courses/pages/CourseDetail/CourseDetail";
import CreateLesson from "../features/courses/pages/CreateLesson/CreateLesson";
import ReviewObjective from "../features/courses/pages/ReviewObjective/ReviewObjective";
import ReviewSkills from "../features/courses/pages/ReviewSkills/ReviewSkills";
import LearnLesson from "../features/learning/pages/LearnLesson/LearnLesson";
import TestWrapper from "../features/content/components/TestWrapper";
import Login from "../features/auth/pages/Login/Login";
import Register from "../features/auth/pages/Register/Register";
import RequireAuth from "../features/auth/components/RequireAuth";


export const router = createBrowserRouter([
    //public auth routes
    { path:'/login',element:<Login/>},
    { path:'/register', element:<Register/>},
    { path:"/",element:<RequireAuth><CourseHome/></RequireAuth>},
    { path:"/course/:courseId",element: <RequireAuth><CourseDetail /></RequireAuth>},
    { path:"/create-lesson",element:<RequireAuth><CreateLesson/></RequireAuth>},
    { path:'/objectives/:lessonId',element:<RequireAuth><ReviewObjective/></RequireAuth>},
    { path: "/skills/:lessonId", element:<RequireAuth><ReviewSkills/></RequireAuth>},
    { path:"/learn/:lessonId",element:<RequireAuth><LearnLesson/></RequireAuth>},
    { path:'/test',element:<TestWrapper/>}
]);