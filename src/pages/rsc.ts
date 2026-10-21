import type { RscPage } from "./rsc-payload";
import type { RscNode, RscPageContent } from "./types";
import { extractProductTile } from "../domains/catalog/helpers";

const ROW_PATTERN = /^([0-9a-f]+):(I?)(.*)$/;
/**
 * "$7" or "$L7" (lazy): the value of row 7. An element type like "$L8" points to module 8 instead;
 * modules aren't rows, so those are kept.
 */
const ROW_REFERENCE_PATTERN = /^\$L?([0-9a-f]+)$/;
/** "$4:props:items:0": a value inside row 4, which React uses to avoid sending the same data twice. */
const PATH_REFERENCE_PATTERN = /^\$([0-9a-f]+):(.+)$/;

/** A React element in an RSC payload: `["$", type, key, props]`. */
type RscElement = ["$", string, unknown, Record<string, unknown> | undefined];

const isElement = (value: unknown): value is RscElement => Array.isArray(value) && value[0] === "$" && typeof value[1] === "string";

/**
 * Returns `value` with the RSC encoding resolved: `"$undefined"` becomes `undefined` (and is
 * dropped from objects and arrays), row references (`"$7"`, `"$L7"`) and path references
 * (`"$4:props:items:0"`) are replaced by the value they point to, and `"$$..."` becomes the literal
 * string `"$..."`. React elements stay tuples, with their props resolved.
 *
 * Each reference is resolved once per call; places that refer to the same value share the
 * decoded object. Throws when references form a cycle.
 * @param {RscPage} page The page the value comes from.
 * @param {unknown} value A row of the page, or a value inside one.
 */
export function decodeRscValue(page: RscPage, value: unknown): unknown {
  const resolved = new Map<string, unknown>();
  const resolving = new Set<string>();

  const resolveReference = (key: string, raw: () => unknown): unknown => {
    if (resolved.has(key)) return resolved.get(key);
    if (resolving.has(key)) throw new Error(`RSC reference cycle at ${key}`);
    resolving.add(key);
    const decoded = decode(raw());
    resolving.delete(key);
    resolved.set(key, decoded);
    return decoded;
  };

  const decode = (item: unknown): unknown => {
    if (typeof item === "string") {
      if (item === "$undefined") return undefined;
      if (item.startsWith("$$")) return item.slice(1);

      const rowId = ROW_REFERENCE_PATTERN.exec(item)?.[1];
      if (rowId !== undefined && rowId in page.rows) return resolveReference(`$${rowId}`, () => page.rows[rowId]);

      const pathReference = PATH_REFERENCE_PATTERN.exec(item);
      if (pathReference && pathReference[1] in page.rows) {
        return resolveReference(item, () => resolvePath(page, pathReference[1], pathReference[2]));
      }
      return item;
    }
    if (Array.isArray(item)) {
      if (isElement(item)) return ["$", item[1], item[2], decode(item[3] ?? {})];
      return item.map(decode).filter((entry) => entry !== undefined);
    }
    if (typeof item === "object" && item !== null) {
      const result: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(item)) {
        const decoded = decode(entry);
        if (decoded !== undefined) result[key] = decoded;
      }
      return result;
    }
    return item;
  };

  return decode(value);
}

/**
 * Follows a reference path like `props:items:0` into a row. `props` on a React element means its
 * props; row references met on the way are followed.
 */
function resolvePath(page: RscPage, rowId: string, path: string): unknown {
  let current: unknown = page.rows[rowId];
  for (const segment of path.split(":")) {
    const rowReference = typeof current === "string" ? /^\$L?([0-9a-f]+)$/.exec(current)?.[1] : undefined;
    if (rowReference !== undefined && rowReference in page.rows) current = page.rows[rowReference];

    if (isElement(current) && segment === "props") current = current[3];
    else if (Array.isArray(current)) current = current[Number(segment)];
    else if (typeof current === "object" && current !== null) current = (current as Record<string, unknown>)[segment];
    else return undefined;
  }
  return current;
}

/**
 * Returns the props (decoded with {@link decodeRscValue}) of every element in the page whose client
 * component path ends with `modulePath`, e.g. `search-page-params-provider.tsx`.
 * @param {RscPage} page The page to search.
 * @param {string} modulePath The end of the component's path in the module reference.
 */
export function findRscElementProps(page: RscPage, modulePath: string): Record<string, unknown>[] {
  const moduleIds = new Set(
    Object.entries(page.modules)
      .filter(([, reference]) => Array.isArray(reference) && typeof reference[0] === "string" && reference[0].endsWith(modulePath))
      .map(([id]) => `$L${id}`),
  );
  const found: Record<string, unknown>[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      if (isElement(value) && moduleIds.has(value[1])) found.push((decodeRscValue(page, value[3] ?? {}) ?? {}) as Record<string, unknown>);
      value.forEach(visit);
    } else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(visit);
    }
  };
  Object.values(page.rows).forEach(visit);
  return found;
}

/**
 * Returns the client chunk ids of the component whose path ends with `modulePath`, from its
 * module reference (`["./path/to/component.tsx", [chunk ids...], "ExportName"]`). Empty when the
 * page doesn't reference the component.
 * @param {RscPage} page The page to search.
 * @param {string} modulePath The end of the component's path in the module reference.
 */
export function findRscModuleChunks(page: RscPage, modulePath: string): string[] {
  for (const reference of Object.values(page.modules)) {
    if (!Array.isArray(reference) || typeof reference[0] !== "string" || !reference[0].endsWith(modulePath)) continue;
    const chunks = Array.isArray(reference[1]) ? reference[1].filter((chunk): chunk is string => typeof chunk === "string") : [];
    return [...new Set(chunks)];
  }
  return [];
}

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

/** "$L8": an element type pointing to module 8. */
const MODULE_REFERENCE_PATTERN = /^\$L?([0-9a-f]+)$/;
const MODULE_NAME_PATTERN = /([^/]+)\.[jt]sx?$/;
/** Components that only provide context (page data, cart, icons); their children are the content. */
const WRAPPER_COMPONENTS = new Set(["pages-provider-hydrator", "page-hydrator", "IconRegistry", "icon-registry"]);

/**
 * Turns an RSC page into a tree of its content components. Each React element whose type is a
 * client component becomes a node named after the component's module; elements nested in its
 * props move to `children`. Wrapper components are left out, their children take their place.
 * The page theme (`tokenRegistry` and `legacyColors`) ends up in `tokens`, and product tiles
 * (`type: "sellable"`) are parsed into `ProductTile` objects.
 * @param {string} pageId The page id, returned as `pageId`.
 * @param {RscPage} page The page, e.g. from `PageClient.getRscPayload`.
 */
export function parseRscPageContent(pageId: string, page: RscPage): RscPageContent {
  let tokens: Record<string, string> = {};
  let nextId = 0;

  /** The client component's module path, e.g. `./logical-components/sections/vertical-list/vertical-list.tsx`. */
  const modulePathOf = (type: string): string | null => {
    const moduleId = MODULE_REFERENCE_PATTERN.exec(type)?.[1];
    const reference = moduleId !== undefined ? page.modules[moduleId] : undefined;
    const path = Array.isArray(reference) ? reference[0] : undefined;
    return typeof path === "string" ? path : null;
  };

  /** Splits a decoded value into plain data (returned) and the component nodes nested in it (pushed to `nodes`). */
  const convert = (value: unknown, nodes: RscNode[]): unknown => {
    if (Array.isArray(value)) {
      if (isElement(value)) {
        nodes.push(...convertElement(value));
        return undefined;
      }
      const items = value.map((item) => convert(item, nodes)).filter((item) => item !== undefined);
      // An array that only held elements (e.g. `children`) has nothing left as data.
      return items.length === 0 && value.length > 0 ? undefined : items;
    }
    if (typeof value !== "object" || value === null) return value;

    const record = value as Record<string, unknown>;
    if (typeof record.tokenRegistry === "object" && record.tokenRegistry !== null) {
      tokens = { ...readStrings(record.tokenRegistry), ...readStrings(record.legacyColors) };
    }
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) {
      const converted = convert(item, nodes);
      if (converted !== undefined) result[key] = converted;
    }
    return result.type === "sellable" ? (extractProductTile(result) ?? result) : result;
  };

  const convertElement = (element: RscElement): RscNode[] => {
    const modulePath = modulePathOf(element[1]);
    const component = modulePath ? (MODULE_NAME_PATTERN.exec(modulePath)?.[1] ?? null) : null;
    const children: RscNode[] = [];
    const props = (convert(element[3] ?? {}, children) ?? {}) as Record<string, unknown>;
    if (!modulePath || !component || WRAPPER_COMPONENTS.has(component)) return children;
    return [{ id: `${component}-${nextId++}`, component, modulePath, props, children }];
  };

  const nodes: RscNode[] = [];
  convert(decodeRscValue(page, page.rows["0"]), nodes);
  return { pageId, tokens, nodes };
}

function readStrings(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
