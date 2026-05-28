import React from "react";
import { BLOCK_REGISTRY } from "./BlockRegistry";

import type { ContentBlock } from "../../learning/api";
import type { GradeResult } from "../components/ShortEssay/ShortEssay";
import EngagementWrapper, {
    type AttemptPayload,
    type EngagementRecord,
    type InteractionRecord,
} from "../components/EngagementWrapper/EngagementWrapper";

import renderMarkdown from "../utils/renderMarkdown";

const MARKDOWN_BLOCK_TYPES = new Set<string>([
    "rich_content",
    "tabs",
    "accordion",
]);

type Props = {
    block: ContentBlock;
    onInteraction?: (record: InteractionRecord) => Promise<void> | void;
    onEngagementEnd?: (record: EngagementRecord) => Promise<void> | void;
    gradeAnswer?: (response: string) => Promise<GradeResult>;
};

type GenericBlockProps = {
    content: any;
    onInteraction?: (payload: AttemptPayload) => Promise<void> | void;
    gradeAnswer?: (response: string) => Promise<GradeResult>;
};

const BlockRenderer = ({
    block,
    onInteraction,
    onEngagementEnd,
    gradeAnswer
}: Props) => {

    const Component =
        BLOCK_REGISTRY[
            block.type as keyof typeof BLOCK_REGISTRY
        ] as React.ComponentType<GenericBlockProps>;

    if (!Component) {
        return (
            <div
                style={{
                    padding:"16px",
                    border:"1px solid #ddd",
                    borderRadius:"8px",
                    marginBottom:"16px"
                }}
            >
                Unsupported block type:
                <strong> {block.type}</strong>
            </div>
        );
    }

    const sharedProps = {
        content: MARKDOWN_BLOCK_TYPES.has(block.type)
            ? renderMarkdown(block.data)
            : block.data,
    };

    const blockElement =
        block.type === "short_essay"
            ? (gradeAnswer
                ? <Component {...sharedProps} gradeAnswer={gradeAnswer} />
                : <div>Missing gradeAnswer function</div>)
            : <Component {...sharedProps} />;

    return (
        <EngagementWrapper
            contentId={block.id}
            contentType={block.type}
            onInteraction={onInteraction}
            onEngagementEnd={onEngagementEnd}
        >
            {blockElement}
        </EngagementWrapper>
    );
};

export default BlockRenderer;
