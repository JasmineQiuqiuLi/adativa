import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
  import LessonNavigation from "../../components/LessonNavigation/LessonNavigation";
  import LearnView from "../../components/LearnView/LearnView";
  import { useUser } from "../../../auth/hooks/useUser";
  import {
    fetchLessonProgress,
    fetchExistingObjectiveContent,
    fetchObjectiveContent,
    fetchObjectiveProgression,
    updateObjectiveProgress,
    postInteraction,
    patchInteractionEngagement,
    type LessonProgress,
    type ObjectiveContent,
    type GenerationMode,
    type ObjectiveProgressionRecommendation,
    type ProgressionAction,
  } from "../../api";
  import type {
    InteractionRecord,
    EngagementRecord,
    InteractionCreatePayload,
  } from "../../types/type";
  import "./LeaarnLesson.css";

  const GRADED_BLOCK_TYPES = new Set([
    "fill_blank",
    "game",
    "match",
    "multiple_answer",
    "multiple_choice",
    "order",
    "short_essay",
    "true_false",
  ]);

  const LearnLesson = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const userId = useUser((s) => s.user?.id);

    const [progress, setProgress] = useState<LessonProgress | null>(null);
    const [currentObjectiveId, setCurrentObjectiveId] = useState<number | null>(null);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [content,setContent] = useState<ObjectiveContent | null> (null)
    const [contentLoading,setContentLoading]=useState(false)
    const [contentError,setContentError]=useState<string | null>(null)
    const [contentMode,setContentMode]=useState<GenerationMode>("initial")
    const [progression,setProgression]=useState<ObjectiveProgressionRecommendation | null>(null)
    const [progressionLoading,setProgressionLoading]=useState(false)
    const [progressionError,setProgressionError]=useState<string | null>(null)
    const [gradedBlockIds,setGradedBlockIds]=useState<number[]>([])
    const [completedGradedBlockIds,setCompletedGradedBlockIds]=useState<Set<number>>(
      () => new Set()
    )

    // One session id per page load — passed on every interaction.
    const sessionId = useMemo(() => {
      if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
      }
      return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }, []);

    // Tracks how many attempt rows we POSTed for each engagement window.
    // engagement_end PATCHes if attempts exist; otherwise we POST a single
    // engagement-only row so non-graded blocks still get recorded.
    const attemptsPerEngagementRef = useRef<Map<string, number>>(new Map());
    const startedObjectivesRef = useRef<Set<number>>(new Set());

    const refreshProgression = useCallback(async () => {
      if (
        !lessonId ||
        !userId ||
        currentObjectiveId == null ||
        selectedObjectiveId !== currentObjectiveId
      ) return;

      try {
        setProgressionLoading(true);
        setProgressionError(null);
        const recommendation = await fetchObjectiveProgression(
          lessonId,
          currentObjectiveId,
          userId
        );
        setProgression(recommendation);
      } catch (err) {
        console.error(err);
        setProgressionError("Failed to load next-step recommendation");
      } finally {
        setProgressionLoading(false);
      }
    }, [lessonId, userId, currentObjectiveId, selectedObjectiveId]);

    const handleInteraction = useCallback(
      async (record: InteractionRecord) => {
        if (!userId) return;

        const payload: InteractionCreatePayload = {
          ...record,
          user_id: userId,
          session_id: sessionId,
        };

        try {
          await postInteraction(payload);
          const count =
            attemptsPerEngagementRef.current.get(record.engagement_id) ?? 0;
          attemptsPerEngagementRef.current.set(
            record.engagement_id,
            count + 1
          );
          const isGradedAttempt =
            record.attempt_number > 0 || Boolean(record.submitted_at);

          if (isGradedAttempt) {
            let shouldRefresh = false;
            setCompletedGradedBlockIds((prev) => {
              if (prev.has(record.content_id)) return prev;

              const next = new Set(prev);
              next.add(record.content_id);
              shouldRefresh =
                gradedBlockIds.length > 0 &&
                gradedBlockIds.every((id) => next.has(id));
              return next;
            });

            if (shouldRefresh) {
              await refreshProgression();
            }
          }
        } catch (err) {
          console.error("Failed to post interaction", err);
        }
      },
      [userId, sessionId, gradedBlockIds, refreshProgression]
    );

    const handleEngagementEnd = useCallback(
      async (record: EngagementRecord) => {
        if (!userId) return;

        const attemptsCount =
          attemptsPerEngagementRef.current.get(record.engagement_id) ?? 0;

        if (attemptsCount > 0) {
          try {
            await patchInteractionEngagement(record.engagement_id, {
              engagement_end: record.engagement_end!,
              active_duration_ms: record.active_duration_ms,
            });
          } catch (err) {
            console.error("Failed to patch engagement", err);
          }
          return;
        }

        // Non-graded block with no in-window attempts: emit one engagement row.
        const payload: InteractionCreatePayload = {
          engagement_id: record.engagement_id,
          started_at: record.started_at,
          engagement_end: record.engagement_end,
          active_duration_ms: record.active_duration_ms,
          content_id: record.content_id,
          content_type: record.content_type,
          interaction_type: `${record.content_type}_session`,
          attempt_number: 0,
          user_id: userId,
          session_id: sessionId,
        };
        try {
          await postInteraction(payload);
        } catch (err) {
          console.error("Failed to post engagement-only row", err);
        }
      },
      [userId, sessionId]
    );


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
          setSelectedObjectiveId(data.current_objective_id);
          setContentMode("initial");
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
      if (!lessonId || selectedObjectiveId==null) return;
      let cancelled=false

      async function loadContent(){
        try{
          setContentLoading(true)
          setContentError(null)

          const isCurrentObjective =
            selectedObjectiveId === currentObjectiveId;
          const data = isCurrentObjective
            ? await fetchObjectiveContent(
                lessonId!,
                selectedObjectiveId!,
                {
                  mode: contentMode,
                  weak_skills:
                    contentMode === "remedial"
                      ? progression?.weak_skills ?? []
                      : [],
                }
              )
            : await fetchExistingObjectiveContent(
                lessonId!,
                selectedObjectiveId!,
                "initial"
              );
          if (cancelled) return;
          setContent(data)
          const nextGradedBlockIds = data.blocks
            .filter((block) => GRADED_BLOCK_TYPES.has(block.type))
            .map((block) => block.id);
          setGradedBlockIds(nextGradedBlockIds);
          setCompletedGradedBlockIds(new Set());
          setProgression(null);
          setProgressionError(null);

          if (
            isCurrentObjective &&
            userId &&
            !startedObjectivesRef.current.has(selectedObjectiveId!)
          ) {
            startedObjectivesRef.current.add(selectedObjectiveId!);
            const progressData = await updateObjectiveProgress(
              lessonId!,
              selectedObjectiveId!,
              userId,
              { status: "in_progress" }
            );
            if (!cancelled) {
              setProgress(progressData);
            }
          }

          if (isCurrentObjective && nextGradedBlockIds.length === 0) {
            await refreshProgression();
          }
        }
        catch(err){
          if (cancelled) return;
          console.error(err)
          setContentError("Failed to load content")
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

    },[lessonId,selectedObjectiveId,currentObjectiveId,userId,contentMode,refreshProgression])


    // Resolve the next objective by order_index. Setting currentObjectiveId
    // causes the content effect above to re-fetch, which unmounts the current
    // blocks — their useFinalize handlers fire POSTs/PATCHes the same way a
    // tab close would.
    const handleProgressionAction = useCallback(async (
      action: ProgressionAction
    ) => {
      if (!lessonId || !userId || currentObjectiveId == null) return;

      if (action === "remedial" || action === "advance") {
        setContent(null);
        setContentMode(action);
        return;
      }
      // Clearing content first ensures the old blocks unmount before the new
      // ones mount, so cleanup handlers (useFinalize) fire predictably.
      setContent(null);
      try {
        const progressData = await updateObjectiveProgress(
          lessonId,
          currentObjectiveId,
          userId,
          { status: "completed" }
        );
        setProgress(progressData);
        setCurrentObjectiveId(progressData.current_objective_id);
        setSelectedObjectiveId(progressData.current_objective_id);
        setContentMode("initial");
        setProgression(null);
        setGradedBlockIds([]);
        setCompletedGradedBlockIds(new Set());
      } catch (err) {
        console.error(err);
        setError("Failed to save lesson progress");
        setCurrentObjectiveId(currentObjectiveId);
        setSelectedObjectiveId(currentObjectiveId);
      }
    }, [lessonId, userId, currentObjectiveId]);

    const handleObjectiveSelect = useCallback((objectiveId: number) => {
      setContent(null);
      setSelectedObjectiveId(objectiveId);
      setContentMode("initial");
      setProgression(null);
      setProgressionError(null);
      setGradedBlockIds([]);
      setCompletedGradedBlockIds(new Set());
    }, []);


    return (
      <div className="learn-layout">
        <LessonNavigation 
          currentObjectiveId={currentObjectiveId}
          selectedObjectiveId={selectedObjectiveId}
          progress={progress}
          onObjectiveSelect={handleObjectiveSelect}
        />

        <div className="middle-panel">
            <LearnView
              selectedObjectiveId={selectedObjectiveId}
              loading={loading}
              error={error}
              content={content}
              contentLoading={contentLoading}
              contentError={contentError}
              contentMode={contentMode}
              progression={progression}
              progressionLoading={progressionLoading}
              progressionError={progressionError}
              gradedBlocksCompleted={completedGradedBlockIds.size}
              gradedBlocksTotal={gradedBlockIds.length}
              progressionEnabled={selectedObjectiveId === currentObjectiveId}
              onInteraction={handleInteraction}
              onEngagementEnd={handleEngagementEnd}
              onProgressionAction={handleProgressionAction}
              onReturnHome={() => navigate("/")}
            />
        </div>

        {/* <Chat /> */}

      </div>
    );
  };

  export default LearnLesson;
