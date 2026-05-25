import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function renderMarkdown(value: any): any {

    // String → React markdown component
    if (typeof value === "string") {

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
            >
                {value}
            </ReactMarkdown>
        );
    }

    // Array
    if (Array.isArray(value)) {

        return value.map(renderMarkdown);
    }

    // Object
    if (
        value &&
        typeof value === "object"
    ) {

        return Object.fromEntries(

            Object.entries(value).map(
                ([key,val])=>[
                    key,
                    renderMarkdown(val)
                ]
            )

        );
    }

    return value;
}

export default renderMarkdown;