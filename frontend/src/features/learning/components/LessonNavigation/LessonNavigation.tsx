import { useState,useEffect} from "react";
import { useParams } from "react-router-dom";
import "./LessonNavigation.css";


type Skill={
    skillId:number;
    name:string;
}

type Objective={
    objectiveId:number;
    orderIndex:number;
    title:string;
    description:string;
    skills:Skill[];
}



const LessonNavigation = () => {
  const {lessonId}=useParams<{lessonId:string}>()

  const [collapsed, setCollapsed] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState<string|null>(null)

  useEffect(()=>{
    async function fetchObjectives(){
        try {
            setLoading(true)
            setError(null)

            const res=await fetch(`http://127.0.0.1:8000/lessons/${lessonId}/objectives-with-skills`)
            const data=await res.json()
            setObjectives(data.objectives || [])
        }

        catch (err){
            console.error(err)
            setError("Unable to load learning plan")
        } finally {
            setLoading(false)
        }
    }
    fetchObjectives()
  },[lessonId])

  return (
    <aside className={`lesson-nav-panel ${collapsed ? "collapsed" : ""}`}>
      <button
        className="panel-toggle left-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? ">" : "<"}
      </button>

      {!collapsed && (
        <div className="lesson-nav-content">
          <h3>Learning Plan</h3>

          {loading && <p className="nav-status">Loading...</p>}

          {error && <p className="nav-error">{error}</p>}

          {!loading && !error && objectives.length === 0 && (
            <p className="nav-status">No objectives found.</p>
          )}

          {!loading &&
            !error &&
            objectives
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((obj) => (
                <div key={obj.objectiveId} className="nav-objective">
                  <p className="nav-objective-title">
                    {obj.orderIndex}. {obj.title}
                  </p>

                  <p className="nav-objective-desc">
                    {obj.description}
                  </p>

                  <ul>
                    {obj.skills.map((skill) => (
                      <li key={skill.skillId}>{skill.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
        </div>
      )}
    </aside>
  );
};

export default LessonNavigation;