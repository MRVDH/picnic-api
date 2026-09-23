"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=rsc.js.map