import "./LearnView.css";

import type {
    GenerationMode,
    ObjectiveContent,
    ObjectiveProgressionRecommendation,
    ProgressionAction,
} from "../../api";
import type { InteractionRecord, EngagementRecord } from "../../types/type";

import BlockRenderer from "../../../content/renderers/BlockRenderer";
import GenerationLoading from "../../../../shared/GenerationLoading/GenerationLoading";

type Props = {
    selectedObjectiveId: number | null;

    loading: boolean;
    error: string | null;

    content: ObjectiveContent | null;
    contentLoading: boolean;
    contentError: string | null;
    contentMode: GenerationMode;

    onInteraction?: (record: InteractionRecord) => Promise<void> | void;
    onEngagementEnd?: (record: EngagementRecord) => Promise<void> | void;
    progression: ObjectiveProgressionRecommendation | null;
    progressionLoading: boolean;
    progressionError: string | null;
    gradedBlocksCompleted: number;
    gradedBlocksTotal: number;
    progressionEnabled: boolean;
    onProgressionAction?: (action: ProgressionAction) => void;

    gradeAnswer?: (
        response: string
    ) => Promise<any>;
};

const LearnView = ({
    selectedObjectiveId,

    loading,
    error,

    content,
    contentLoading,
    contentError,
    contentMode,

    onInteraction,
    onEngagementEnd,
    progression,
    progressionLoading,
    progressionError,
    gradedBlocksCompleted,
    gradedBlocksTotal,
    progressionEnabled,
    onProgressionAction,
    gradeAnswer

}: Props) => {

    if (loading) {
        return (
            <main className="learn-view-panel">
                <p>Loading...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="learn-view-panel">
                <p style={{ color:"#b91c1c" }}>
                    {error}
                </p>
            </main>
        );
    }

    if (selectedObjectiveId === null) {
        return (
            <main className="learn-view-panel">
                <h2>
                    Lesson complete
                </h2>

                <p>
                    You've finished all objectives
                    in this lesson.
                </p>
            </main>
        );
    }

    if (contentLoading) {
        return (
            <div className="learn-content">
                <GenerationLoading
                    variant="content"
                    mode={contentMode}
                />
            </div>
        );
    }

    if (contentError) {
        return (
            <main className="learn-view-panel">
                <p style={{ color:"#b91c1c" }}>
                    {contentError}
                </p>
            </main>
        );
    }

    return (

        <div className="learn-content">

            {content?.blocks.map((block)=>(

                <div
                    key={block.id}
                    className="learn-block-wrapper"
                >
                    <BlockRenderer
                        block={block}
                        onInteraction={onInteraction}
                        onEngagementEnd={onEngagementEnd}
                        gradeAnswer={gradeAnswer}
                    />
                </div>

            ))}

            {progressionEnabled && onProgressionAction && gradedBlocksTotal > gradedBlocksCompleted && (
                <section className="progression-panel progression-panel--locked">
                    <div className="progression-panel-header">
                        <h3>Unlock your next step</h3>
                    </div>
                    <p className="progression-reason">
                        Complete {gradedBlocksCompleted}/{gradedBlocksTotal} checks
                        to unlock your next step.
                    </p>
                    <div className="progression-meter">
                        <div
                            className="progression-meter-fill"
                            style={{
                                width: `${Math.round(
                                    (gradedBlocksCompleted / gradedBlocksTotal) * 100
                                )}%`,
                            }}
                        />
                    </div>
                </section>
            )}

            {progressionEnabled && onProgressionAction && gradedBlocksTotal <= gradedBlocksCompleted && (
                <section className="progression-panel">
                    <div className="progression-panel-header">
                        <h3>Choose your next step</h3>
                        {progressionLoading && (
                            <span className="progression-status">
                                Updating...
                            </span>
                        )}
                    </div>

                    {progressionError && (
                        <p className="progression-error">
                            {progressionError}
                        </p>
                    )}

                    {progression && (
                        <p className="progression-reason">
                            {progression.reason}
                        </p>
                    )}

                    <div className="progression-options">
                        {progression?.options.map((option) => (
                            <button
                                key={option.action}
                                type="button"
                                className={
                                    option.recommended
                                        ? "progression-option progression-option--recommended"
                                        : "progression-option"
                                }
                                onClick={() => onProgressionAction(option.action)}
                                disabled={!option.enabled || progressionLoading}
                            >
                                <span className="progression-option-title">
                                    {option.label}
                                </span>
                                <span className="progression-option-desc">
                                    {option.description}
                                </span>
                                {option.recommended && (
                                    <span className="progression-badge">
                                        Recommended
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>
            )}

        </div>

    );
};

export default LearnView;
