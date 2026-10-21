/**
 * Helpers for reading Fusion pages: PML trees of components (`STACK`, `CONTAINER`, `RICH_TEXT`,
 * `PRICE`, ...) whose texts are markdown with Picnic's color tags (`#(#333333)text#(#333333)`).
 */

export type PmlNode = Record<string, unknown>;

/** Text colors the app uses for regular text; a different color marks a highlight. */
const DEFAULT_TEXT_COLORS = new Set(["#333333", "#5b534e", "#787570"]);

const isNode = (value: unknown): value is PmlNode => typeof value === "object" && value !== null && !Array.isArray(value);

/** Strips Picnic's color tags: `#(#aabbcc)text#(#aabbcc)` → `text`. */
export function stripColorTags(markdown: string): string {
  return markdown.replace(/#\([^)]+\)/g, "").trim();
}

/** Strips color tags and bold/underline markers: `#(#628003)**Bio**#(#628003) melk` → `Bio melk`. */
export function cleanMarkdown(markdown: string): string {
  return stripColorTags(markdown).replace(/\*\*/g, "").replace(/__/g, "").replace(/ /g, " ").trim();
}

/**
 * Returns the first color tag that isn't a regular text color, e.g. `#B40117` for
 * `#(#333333)#(#B40117)Prijskampioen#(#B40117)#(#333333)`, or `null` when there is none.
 */
export function extractHighlightColor(markdown: string): string | null {
  for (const match of markdown.matchAll(/#\(([^)]+)\)/g)) {
    if (!DEFAULT_TEXT_COLORS.has(match[1].toLowerCase())) return match[1];
  }
  return null;
}

/** Whether a color is one of the app's regular text colors. */
export const isDefaultTextColor = (color: string): boolean => DEFAULT_TEXT_COLORS.has(color.toLowerCase());

/** Visits every object in a tree, depth first. */
export function walkNodes(node: unknown, visit: (node: PmlNode) => void): void {
  if (Array.isArray(node)) {
    node.forEach((child) => walkNodes(child, visit));
  } else if (isNode(node)) {
    visit(node);
    Object.values(node).forEach((child) => walkNodes(child, visit));
  }
}

/** Returns the first node (depth first) that matches `predicate`. */
export function findNode(node: unknown, predicate: (node: PmlNode) => boolean): PmlNode | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findNode(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (!isNode(node)) return null;
  if (predicate(node)) return node;
  for (const child of Object.values(node)) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

/** Returns the nodes that contain `target`, nearest first, or an empty list when it isn't in the tree. */
export function ancestorsOf(root: unknown, target: PmlNode): PmlNode[] {
  const path: PmlNode[] = [];
  const visit = (node: unknown): boolean => {
    if (node === target) return true;
    if (Array.isArray(node)) return node.some(visit);
    if (!isNode(node)) return false;
    path.push(node);
    if (Object.values(node).some(visit)) return true;
    path.pop();
    return false;
  };
  return visit(root) ? path.reverse() : [];
}

/** Returns the first node with this `id`. */
export const findNodeById = (node: unknown, id: string): PmlNode | null => findNode(node, (n) => n.id === id);

/** Returns the first node whose `id` starts with `prefix`. */
export const findNodeByIdPrefix = (node: unknown, prefix: string): PmlNode | null =>
  findNode(node, (n) => typeof n.id === "string" && n.id.startsWith(prefix));

/** Returns every value of property `key` in the tree, like JSONPath `$..key`. */
export function collectPropertyValues(node: unknown, key: string): unknown[] {
  const values: unknown[] = [];
  walkNodes(node, (n) => {
    if (key in n) values.push(n[key]);
  });
  return values;
}

/** Returns every `markdown` string in the tree, in document order. */
export function collectMarkdowns(node: unknown): string[] {
  return collectPropertyValues(node, "markdown").filter((m): m is string => typeof m === "string");
}

/** The children of a node: `children`, or `child` as a one-element list. */
export function childrenOf(node: PmlNode): PmlNode[] {
  const children = node.children ?? node.child;
  if (Array.isArray(children)) return children.filter(isNode);
  return isNode(children) ? [children] : [];
}

/** A `PRICE` component: a price in cents, crossed out for an original price. */
export type PriceNode = { price: number; isCrossed: boolean; color: string | null };

/** Returns every `PRICE` component in the tree. */
export function collectPriceNodes(node: unknown): PriceNode[] {
  const prices: PriceNode[] = [];
  walkNodes(node, (n) => {
    if (n.type === "PRICE" && typeof n.price === "number") {
      prices.push({ price: n.price, isCrossed: n.isCrossed === true, color: typeof n.color === "string" ? n.color : null });
    }
  });
  return prices;
}

/** A colored badge: a `CONTAINER` with a background color and rounded corners around a text. */
export type PmlBadge = { text: string; textColor: string; backgroundColor: string };

/** Returns the badges in the tree (product labels, allergens), outermost first. */
export function collectBadges(node: unknown): PmlBadge[] {
  const badges: PmlBadge[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!isNode(n)) return;
    if (n.type === "CONTAINER" && typeof n.backgroundColor === "string" && typeof n.borderRadius === "number") {
      const markdown = collectMarkdowns(n)[0];
      if (markdown) {
        // A color tag in the text wins over the text attributes, e.g. `#(#ffffff)XL#(#ffffff)`.
        const textColor =
          extractHighlightColor(markdown) ??
          collectPropertyValues(n, "textAttributes")
            .map((attributes) => (isNode(attributes) ? attributes.color : undefined))
            .find((color): color is string => typeof color === "string");
        badges.push({ text: cleanMarkdown(markdown), textColor: textColor ?? "#333333", backgroundColor: n.backgroundColor });
        return;
      }
    }
    Object.values(n).forEach(visit);
  };
  visit(node);
  return badges;
}

/** A row of a nutrition table: a nutrient and its amount; main nutrients are categories. */
export type PmlNutritionRow = { label: string; value: string | null; isCategory: boolean; backgroundColor: string | null };

/**
 * Returns the rows of a nutrition table (product and recipe pages): horizontal stacks with a label
 * and a value, spread to both sides. Main nutrients have a `HEADLINE2` label.
 */
export function collectNutritionRows(node: unknown): PmlNutritionRow[] {
  const rows: PmlNutritionRow[] = [];
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!isNode(n)) return;
    if (n.type === "STACK" && n.axis === "HORIZONTAL" && (n.distribution === "SPACE_BETWEEN" || n.distribution === "END")) {
      const texts = childrenOf(n).filter((c) => c.type === "RICH_TEXT" && typeof c.markdown === "string");
      if (texts.length > 0) {
        rows.push({
          label: stripColorTags(texts[0].markdown as string),
          value: texts[1] ? stripColorTags(texts[1].markdown as string) : null,
          isCategory: texts[0].textType === "HEADLINE2",
          backgroundColor: typeof n.backgroundColor === "string" ? n.backgroundColor : null,
        });
        return;
      }
    }
    Object.values(n).forEach(visit);
  };
  visit(node);
  return rows;
}

/** The items of an accordion list (`{ header, body }`), or an empty list. */
export function accordionItems(accordion: unknown): PmlNode[] {
  const items = collectPropertyValues(accordion, "items")[0];
  return Array.isArray(items) ? items.filter(isNode) : [];
}

/** Returns the first `pml.component` in or below a node. */
export function findPmlComponent(node: unknown): PmlNode | null {
  const found = findNode(node, (n) => isNode(n.pml) && isNode((n.pml as PmlNode).component));
  return found ? ((found.pml as PmlNode).component as PmlNode) : null;
}

/** An analytics context of a component: a Snowplow schema and its data. */
export type AnalyticsContext = { schema?: string; data?: Record<string, unknown> };

/** The analytics contexts of a node (`analytics.contexts`), or an empty list. */
export function analyticsContexts(node: PmlNode): AnalyticsContext[] {
  const analytics = node.analytics;
  const contexts = isNode(analytics) ? analytics.contexts : undefined;
  return Array.isArray(contexts) ? contexts.filter(isNode) : [];
}
