import { useEffect, useState } from "react";
  import { useParams } from "react-router-dom";
  import LessonNavigation from "../../components/LessonNavigation/LessonNavigation";
  import LearnView from "../../components/LearnView/LearnView";
  import Chat from "../../components/Chat/Chat";
  import { useUser } from "../../../auth/hooks/useUser";
  import { fetchLessonProgress,fetchObjectiveContent, type LessonProgress, type ObjectiveContent } from "../../api";
  import "./LeaarnLesson.css";

  const LearnLesson = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const userId = useUser((s) => s.user?.id);

    const [progress, setProgress] = useState<LessonProgress | null>(null);
    const [currentObjectiveId, setCurrentObjectiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [content,setContent] = useState<ObjectiveContent | null> (null)
    const [contentLoading,setContentLoading]=useState(false)
    const [contentError,setContentError]=useState<string | null>(null)


    useEffect(() => {
      if (!lessonId || !userId) return;
      let cancelled = false;

      async function load() {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchLessonProgress(lessonId!, userId!);
          if (cancelled) return;
          setProgress(data);
          setCurrentObjectiveId(data.current_objective_id);
        } catch (err) {
          if (cancelled) return;
          console.error(err);
          setError("Failed to load lesson progress");
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [lessonId, userId]);

    useEffect(()=>{
      if (!lessonId || currentObjectiveId==null) return; //what about the scenario when the module is completed?
      let cancelled=false

      async function loadContent(){
        try{
          setContentLoading(true)
          setContentError(null)

          const data=await fetchObjectiveContent(lessonId!,currentObjectiveId!)
          if (cancelled) return;
          setContent(data)
        }
        catch(err){
          if (cancelled) return;
          console.error(err)
          setContentError("Failed to generate content")
        } finally {
          if (!cancelled){
            setContentLoading(false)
          }
        }
      }
      
      loadContent()

      return ()=>{
        cancelled=true;
      }

    },[lessonId,currentObjectiveId])
      


    return (
      <div className="learn-layout">
        <LessonNavigation />
        
        <div className="middle-panel">
            <LearnView
              lessonId={lessonId ?? null}
              currentObjectiveId={currentObjectiveId}
              loading={loading}
              error={error}
              content={content}
              contentLoading={contentLoading}
              contentError={contentError}
            />
        </div>

        <Chat />
        
      </div>
    );
  };

  export default LearnLesson;