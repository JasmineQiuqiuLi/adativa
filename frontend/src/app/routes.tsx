import {createBrowserRouter} from "react-router-dom"
import CourseHome from "../features/courses/pages/CourseHome/CourseHome"
import CourseDetail from "../features/courses/pages/CourseDetail/CourseDetail";
import CreateLesson from "../features/courses/pages/CreateLesson/CreateLesson";
import ReviewObjective from "../features/courses/pages/ReviewObjective/ReviewObjective";
import ReviewSkills from "../features/courses/pages/ReviewSkills/ReviewSkills";
import LearnLesson from "../features/learning/pages/LearnLesson/LearnLesson";
import MultipleChoice from "../features/content/components/MultipleChoice/MultipleChoice";
import MultipleAnswer from "../features/content/components/MultipleAnswer/MultipleAnswer";
import TrueOrFalse from "../features/content/components/TrueOrFalse/TrueOrFalse";
import Accordion from "../features/content/components/Accordion/Accordion";
import FlashCards from "../features/content/components/FlashCards/FlashCards";
import Tabs from "../features/content/components/Tabs/Tabs";
import Steps from "../features/content/components/Steps/Steps";
import TestWrapper from "../features/content/components/TestWrapper";


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
        path:'/objectives/:lessonId',
        element:<ReviewObjective/>
    },
    {
        path: "/skills/:lessonId", 
        element:<ReviewSkills/>
    },
    {
        path:"/learn/:lessonId",
        element:<LearnLesson/>
    },
    {
        path:"/mcq",
        element:<MultipleChoice/>
    },
    {
        path:"/maq",
        element:<MultipleAnswer/>
    },
    {
        path:"/tof",
        element:<TrueOrFalse/>
    },
    {
        path:"/accordion",
        element:<Accordion/>
    },
    {
        path:"/flash",
        element:<FlashCards/>
    },
    {
        path:"/tabs",
        element:<Tabs/>

    },
    {
        path:"/steps",
        element:<Steps/>
    },
    {
        path:'/test',
        element:<TestWrapper/>
    }
]);