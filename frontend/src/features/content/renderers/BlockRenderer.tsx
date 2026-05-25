import React from "react";
import { BLOCK_REGISTRY } from "./BlockRegistry";

import type { ContentBlock } from "../../learning/api";
import type { InteractionResult } from "../../learning/types/type";
import type { GradeResult } from "../components/ShortEssay/ShortEssay";

import transformMarkdown from "../utils/transformMarkdown";
import renderMarkdown from "../utils/renderMarkdown";

type Props = {
    block: ContentBlock;
    onInteraction?: (interaction: InteractionResult) => Promise<void>;
    gradeAnswer?: (response: string) => Promise<GradeResult>;
};

type GenericBlockProps = {
    content: any;
    onInteraction?: ( interaction: InteractionResult) => Promise<void>;
    gradeAnswer?: (response: string) => Promise<GradeResult>;
};

const BlockRenderer = ({
    block,
    onInteraction,
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
        content: renderMarkdown(block.data),
        onInteraction
    };

    switch(block.type){

        case "short_essay":

            if(!gradeAnswer){
                return (
                    <div>
                        Missing gradeAnswer function
                    </div>
                );
            }

            return (
                <Component
                    {...sharedProps}
                    gradeAnswer={gradeAnswer}
                />
            );

        default:

            return (
                <Component
                    {...sharedProps}
                />
            );
    }
};

export default BlockRenderer;