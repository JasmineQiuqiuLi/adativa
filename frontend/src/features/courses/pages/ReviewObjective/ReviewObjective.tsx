import React from 'react'
import { useState } from 'react'
import "./ReviewObjective.css"


type GeneratedObjective={
    orderIndex:number;
    title:string;
    description:string;
}

type Props={
    objectives:GeneratedObjective[];
    onRevise:(feedback:string)=>Promise<void>;
    onAccept:()=>Promise<void>
}

const ReviewObjective = ({objectives,onRevise,onAccept}:Props) => {
  const [feedback,setFeedback]=useState("")
  const [loadingRevise,setLoadingRevise]=useState(false)
  const [loadingAccept,setLoadingAccept]=useState(false)
  const [error,setError]=useState<string | null>(null)
  const isLoading=loadingRevise || loadingAccept

  async function handleRevise(){
    if (!feedback.trim()) return;
    setError(null)
    setLoadingRevise(true)

    try {
        await onRevise(feedback.trim());
        setFeedback("");
    } catch {
        setError("Failed to revise. Please try again")
    } finally {
        setLoadingRevise(false)
    }
  }

  async function handleAccept(){
    setError(null)
    setLoadingAccept(true)
    try{
        await onAccept()
    } catch(err){
        const msg=err instanceof Error ?err.message :"Failed to save";
        setError(msg)
        setLoadingAccept(false)
    }
  }


  return (
    <div className="objectives-container">
        {/** Header */}
        <div className="objectives-header">
            <h2>Your Learning Objectives</h2>
            <p>Here's your personalized learning path. Adjust anything that doesn't feel right</p>
        </div>

        {/**Objectives List */}
        <ol className="objectives-list">
            {objectives.map((obj)=>(
                <li key={obj.orderIndex} className='objective-item'>
                    <div className='objective-index'>{obj.orderIndex}</div>
                    <div className="objective-content">
                        <p className='objective-title'>{obj.title}</p>
                        <p className='objective-desc'>{obj.description}</p>
                    </div>
                </li>
            ))}
        </ol>

        {/** Feedback */}
        <div className="feedback-section">
            <label>
                Feedback <span>(optional)</span>
            </label>
            <textarea
                rows={2}
                placeholder='e.g., Make objective 3 more beginner friendly'
                value={feedback}
                onChange={(e)=>setFeedback(e.target.value)}
                disabled={isLoading}
            />
        </div>

        {/**error */}
        {error && <div className='error-box'>{error}</div>}

        {/** Actions */}
        <div className='actions'>
            <button
                onClick={handleRevise}
                disabled={isLoading || !feedback.trim()}
                className='secondary-btn'
            >
                {isLoading?"Revising...":"Revise"}
            </button>

            <button
                onClick={handleAccept}
                disabled={isLoading}
                className='primary-btn'
            >
                {loadingAccept?"Saving...":"Looks good"}
            </button>

        </div>
    </div>
  )
}

export default ReviewObjective
