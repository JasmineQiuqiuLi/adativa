"use client";

import MultipleChoice from "../MultipleChoice/MultipleChoice";
import type { MCQBlock } from "../MultipleChoice/MultipleChoice";
import type { AttemptPayload } from "../EngagementWrapper/EngagementWrapper";


export type TrueFalseBlock = {
  content_id:string;

  type:"true_false";

  title?:string;

  question:string;

  correct_answer:"true"|"false";

  true_feedback?:string;

  false_feedback?:string;
};




interface Props{
   content:TrueFalseBlock;
   onInteraction?:(payload:AttemptPayload)=>void|Promise<void>;
   onAttemptRetry?: () => void;
}

export default function TrueOrFalse({

   content,
   onInteraction,
   onAttemptRetry

}:Props){

   const mcqContent:MCQBlock={

      content_id:
         content.content_id,

      type:"mcq",

      title:
         content.title,

      question:
         content.question,

      options:[

         {
            id:"true",
            label:"True"
         },

         {
            id:"false",
            label:"False"
         }

      ],

      correct_answer_id:
         content.correct_answer,

      explanation:
         content.correct_answer
         ==="true"

         ?content.true_feedback

         :content.false_feedback

   };


   return(

      <MultipleChoice
         content={
            mcqContent
         }
         onInteraction={
            onInteraction
         }
         onAttemptRetry={
            onAttemptRetry
         }
      />

   );

}
