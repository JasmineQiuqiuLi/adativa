import "./LearnView.css";

import type { ObjectiveContent } from "../../api";

import BlockRenderer from "../../../content/renderers/BlockRenderer";

type Props = {
    lessonId: string | null;
    currentObjectiveId: number | null;

    loading: boolean;
    error: string | null;

    content: ObjectiveContent | null;
    contentLoading: boolean;
    contentError: string | null;

    onInteraction?: (interaction:any)=>Promise<void>;

    gradeAnswer?: (
        response:string
    )=>Promise<any>;
};

const LearnView = ({
    lessonId,
    currentObjectiveId,

    loading,
    error,

    content,
    contentLoading,
    contentError,

    onInteraction,
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
                        gradeAnswer={gradeAnswer}
                    />
                </div>

            ))}

        </div>

    );
};

export default LearnView;