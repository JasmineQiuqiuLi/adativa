import { useEffect, useState } from 'react'
import "./ReviewObjective.css"
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

type GeneratedObjective={
    orderIndex:number;
    title:string;
    description:string;
}

const ReviewObjective = () => {
    
  const navigate=useNavigate()

  const {lessonId}=useParams()
  const [objectives,setObjectives]=useState<GeneratedObjective[]>([])

  const [feedback,setFeedback]=useState("")
  const [loadingRevise,setLoadingRevise]=useState(false)
  const [loadingAccept,setLoadingAccept]=useState(false)
  const [error,setError]=useState<string | null>(null)
  const isLoading=loadingRevise || loadingAccept

  useEffect(()=>{
    if (!lessonId) return;

    fetch(`http://127.0.0.1:8000/lessons/${lessonId}`)
        .then(res=>res.json())
        .then(data=>setObjectives(data.objectives))
        .catch(err=>{
            console.error(err);
            setError("Failed to load objectives")
        });
  },[lessonId])

  async function handleRevise(){
    if (!feedback.trim() || !lessonId) return;
    setError(null)
    setLoadingRevise(true)

    try {
        const res=await fetch(
            `http://127.0.0.1:8000/lessons/${lessonId}/revise`,
            {
                method:'POST',
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify({feedback})
            }
        )
        const data=await res.json()

        setObjectives(data)
        console.log("REVISE RESPONSE:", data);
        setFeedback("");

    } catch {
        setError("Failed to revise. Please try again")
    } finally {
        setLoadingRevise(false)
    }
  }

  async function handleAccept(){
    if (!lessonId) return;
    setError(null)
    setLoadingAccept(true)
    try{
        navigate(`/skills/${lessonId}`)
    } catch(err){
        const msg=err instanceof Error ?err.message :"Failed to save";
        setError(msg)
        
    } finally {
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
            {Array.isArray(objectives) && objectives.map((obj)=>(
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
