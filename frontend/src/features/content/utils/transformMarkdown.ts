import { marked } from "marked";

function transformMarkdown(value: any): any {

    if (typeof value === "string") {

        return marked.parseInline(value);
    }

    if (Array.isArray(value)) {

        return value.map(transformMarkdown);
    }

    if (
        value &&
        typeof value === "object"
    ) {

        return Object.fromEntries(

            Object.entries(value).map(
                ([key,val])=>[
                    key,
                    transformMarkdown(val)
                ]
            )

        );
    }

    return value;
}

export default transformMarkdown;