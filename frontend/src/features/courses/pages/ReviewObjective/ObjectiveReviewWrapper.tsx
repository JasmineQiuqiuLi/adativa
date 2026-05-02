// import { useNavigate } from "react-router-dom";
// import ReviewObjective from "./ReviewObjective";

// function ObjectivesReviewWrapper() {
//   const navigate = useNavigate();

//   // Temporary mock data (replace with API later)
//   const objectives = [
//     {
//       orderIndex: 1,
//       title: "Understand Python basics",
//       description: "Variables, data types, and control flow",
//     },
//     {
//       orderIndex: 2,
//       title: "Work with data",
//       description: "Using pandas to analyze datasets",
//     },
//   ];

//   const handleRevise = async (feedback: string) => {
//     console.log("Revise with:", feedback);
//     // later: call API
//   };

//   const handleAccept = async () => {
//     // later: save course
//     navigate("/course/1");
//   };

//   return (
//     <ReviewObjective
//       objectives={objectives}
//       onRevise={handleRevise}
//       onAccept={handleAccept}
//     />
//   );
// }

// export default ObjectivesReviewWrapper