import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const RAW_STRING_KEYS = new Set([
    "id",
    "type",
    "variant",
    "layout",
    "image_url",
    "image_alt",
    "video_url",
    "thumbnail_url",
    "character_avatar",
]);

function shouldKeepRawString(key?: string): boolean {
    return !!key && (
        RAW_STRING_KEYS.has(key) ||
        key.endsWith("_id") ||
        key.endsWith("_ids") ||
        key.endsWith("_url")
    );
}

function renderMarkdown(value: any,key?: string): any {
    if (shouldKeepRawString(key)) {
        return value;
    }

    if (typeof value === "string") {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
            >
                {value}
            </ReactMarkdown>
        );
    }

    if (Array.isArray(value)) {
        return value.map((item)=>renderMarkdown(item,key));
    }

    if (
        value &&
        typeof value === "object"
    ) {
        return Object.fromEntries(
            Object.entries(value).map(
                ([childKey,val])=>[
                    childKey,
                    renderMarkdown(val,childKey)
                ]
            )
        );
    }

    return value;
}

export default renderMarkdown;
