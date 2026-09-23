/**
 * Types for pages served as a React Server Components (RSC) "flight" payload
 * (content-type `text/x-component`) instead of a Fusion page.
 *
 * Picnic serves some pages in this format to newer app versions, depending on
 * the `x-picnic-agent` header. The payload is a React component tree: each row
 * holds either a client component reference or JSON, and React elements are
 * tuples of the form `["$", type, key, props]`. The page data lives in the
 * element props.
 */
/** A page served as an RSC payload, split into its rows. */
export type RscPage = {
    /** The JSON rows of the payload, keyed by row id (hex string). Row `"0"` is the root. */
    rows: Record<string, unknown>;
    /**
     * The client component references (`I[...]` rows), keyed by row id. An element
     * type like `"$L8"` points to row `"8"` here, e.g. `["./logical-components/sections/vertical-list/vertical-list.tsx", ...]`.
     */
    modules: Record<string, unknown>;
};
/** The formats Picnic can serve a page in. */
export type PageFormat = "fusion" | "rsc";
//# sourceMappingURL=rsc.d.ts.map