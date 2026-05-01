import "./CreateLesson.css"
import { useState } from "react"

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

  return (
    <div className="create-lesson-container">
      <form className="create-lesson-form">
        {/** Goal */}
        <div className="form-group">
            <label >What do you want to learn?</label>
            <textarea 
                rows={4}
                placeholder="e.g., I want to learn Python for data analysis"
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
                        onClick={()=>setStyle(s.value as any)}
                        className={style===s.value?"card active":"card"}
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
        <button className="submit-btn">
            Build my learning path
        </button>
      </form>
    </div>
  )
}

export default CreateLesson
