import type { RscPage } from "../../types/rsc";

const ROW_PATTERN = /^([0-9a-f]+):(I?)(.*)$/;

/**
 * Parses a React Server Components (RSC) "flight" payload into its rows.
 *
 * The payload is newline-separated rows of the form `<hex id>:<payload>`.
 * JSON rows end up in `rows`, client component references (`I[...]`) in
 * `modules`. Other row kinds (hints, text chunks) carry no page data and are
 * skipped, as are lines that aren't valid JSON on their own.
 * @param {string} payload The raw `text/x-component` response body.
 */
export function parseRscPayload(payload: string): RscPage {
  const page: RscPage = { rows: {}, modules: {} };

  for (const line of payload.split("\n")) {
    const match = ROW_PATTERN.exec(line);
    if (!match) continue;

    const [, id, importMarker, value] = match;
    try {
      const parsed: unknown = JSON.parse(value);
      if (importMarker) {
        page.modules[id] = parsed;
      } else {
        page.rows[id] = parsed;
      }
    } catch {
      // Not a JSON row (e.g. a hint or text chunk), so no page data.
    }
  }

  return page;
}
