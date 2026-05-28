import "./LearnView.css";

import type { ObjectiveContent } from "../../api";
import type { InteractionRecord, EngagementRecord } from "../../types/type";

import BlockRenderer from "../../../content/renderers/BlockRenderer";

type Props = {
    currentObjectiveId: number | null;

    loading: boolean;
    error: string | null;

    content: ObjectiveContent | null;
    contentLoading: boolean;
    contentError: string | null;

    onInteraction?: (record: InteractionRecord) => Promise<void> | void;
    onEngagementEnd?: (record: EngagementRecord) => Promise<void> | void;
    onNext?: () => void;
    canGoNext?: boolean;

    gradeAnswer?: (
        response: string
    ) => Promise<any>;
};

const LearnView = ({
    currentObjectiveId,

    loading,
    error,

    content,
    contentLoading,
    contentError,

    onInteraction,
    onEngagementEnd,
    onNext,
    canGoNext,
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

    if (currentObjectiveId === null) {
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
            <main className="learn-view-panel">
                <p>
                    Loading content...
                </p>
            </main>
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

            {onNext && (
                <div className="learn-next-row">
                    <button
                        className="learn-next-button"
                        onClick={onNext}
                        disabled={!canGoNext}
                    >
                        Next
                    </button>
                </div>
            )}

        </div>

    );
};

export default LearnView;
