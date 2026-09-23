import type { RscPage } from "../../types/rsc";
/**
 * Parses a React Server Components (RSC) "flight" payload into its rows.
 *
 * The payload is newline-separated rows of the form `<hex id>:<payload>`.
 * JSON rows end up in `rows`, client component references (`I[...]`) in
 * `modules`. Other row kinds (hints, text chunks) carry no page data and are
 * skipped, as are lines that aren't valid JSON on their own.
 * @param {string} payload The raw `text/x-component` response body.
 */
export declare function parseRscPayload(payload: string): RscPage;
//# sourceMappingURL=rsc.d.ts.map