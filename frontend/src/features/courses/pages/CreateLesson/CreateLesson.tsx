import "./CreateLesson.css"
import { useState } from "react"
import { useNavigate } from "react-router-dom";

type LearningPreferences={
    style:"visual" | "reading" | "hands-on" | "mixed";
    pace:"relaxed" | "normal" | "intensive";
};

const AGE_RANGES=["9–12", "13–15", "16–18", "19–21", "22–24"];


const STYLES = [
  { value: "visual", label: "Visual", desc: "Diagrams, charts, images" },
  { value: "reading", label: "Reading", desc: "Text, articles, notes" },
  { value: "hands-on", label: "Hands-on", desc: "Doing and building" },
  { value: "mixed", label: "Mixed", desc: "A bit of everything" },
];

const PACES = [
  { value: "relaxed", label: "Relaxed" },
  { value: "normal", label: "Normal" },
  { value: "intensive", label: "Intensive" },
];


const CreateLesson = () => {
  const [goal,setGoal]=useState("")
  const [ageRange,setAgeRange]=useState("")
  const [style,setStyle]=useState<LearningPreferences["style"]>("mixed")
  const [pace,setPace]=useState<LearningPreferences["pace"]>("normal")

  const [loading,setLoading]=useState(false)
  const [error,setError]=useState<string | null>(null)

  const navigate = useNavigate();

  const handleSubmit=async (e:React.FormEvent)=>{
    e.preventDefault()
    const data={
        goal,
        ageRange,
        style,
        pace,
    }
    try{
        setLoading(true)
        setError(null)

        const res=await fetch("http://127.0.0.1:8000/lessons/create",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(data)
        })
        const result=await res.json()
        console.log("Backend response",result)

        navigate(`/objectives/${result.lessonId}`)

    } catch(err){
        console.error("Error calling backend",err)
        setError("Failed to create lesson")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="create-lesson-container">
      <form className="create-lesson-form" onSubmit={handleSubmit}>
        {/** Goal */}
        <div className="form-group">
            <label >What do you want to learn?</label>
            <textarea 
                rows={4}
                placeholder="e.g., I want to learn Python for data analysis"
                disabled={loading}
                value={goal}
                onChange={(e)=>setGoal(e.target.value)}
            />
            <p className="hint">
                Be specific — the more detail, the better your learning path. 
            </p>
        </div>

        {/** Age */}
        <div className="form-group">
            <label>Your age range</label>
            <div className="button-group">
                {AGE_RANGES.map((r)=>(
                    <button
                        key={r}
                        type="button"
                        disabled={loading}
                        onClick={()=>setAgeRange(r)}
                        className={ageRange===r?"active":""}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>

        {/**Style */}
        <div className="form-group">
            <label>How do you like to learn?</label>
            <div className="grid">
                {STYLES.map((s)=>(
                    <button
                        key={s.value}
                        type="button"
                        disabled={loading}
                        onClick={()=>setStyle(s.value as any)}
                        className={style===s.value?"create-lesson-card active":"create-lesson-card"}
                    >
                        <div className="card-title">{s.label}</div>
                        <div className="card-desc">{s.desc}</div>
                    </button>
                ))}
            </div>
        </div>

        {/** pace */}
        <div className="form-group">
            <label>Preferred pace</label>
            <div className="button-group">
                {
                    PACES.map((p)=>(
                        <button
                            key={p.value}
                            type="button"
                            disabled={loading}
                            onClick={()=>setPace(p.value as any)}
                            className={pace===p.value?"active":""}
                        >
                            {p.label}
                        </button>
                    ))
                }
            </div>
        </div>

        {/** submit */}
        <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Building your learning path..." : "Build my learning path"}
        </button>
      </form>
      {error && <div className="error-box">{error}</div>}
    </div>
  )
}

export default CreateLesson
