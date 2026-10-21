import { CartFooter, CartFooterText, CartRecommendationTile, CartRecommendations } from "./types";

/** A node of a PML page. Fields are read defensively, because Picnic can change them. */
type PmlNode = Record<string, unknown>;

const LOYALTY_ID = "loyalty-point-nudge-content";
const RECOMMENDATIONS_HEADER_ID = "horizontal-selling-unit-tiles-sub-header";
const RECOMMENDATIONS_TILES_ID = "horizontal-selling-unit-tiles";
/** Tiles are PML nodes with ids like "item-s1009021", where the rest is the product id. */
const TILE_ID_PREFIX = "item-";
/** The full list the app opens from the header and the tiles. */
const RECOMMENDATIONS_PAGE_ID = "basket-recommendations-root";

/** Turns the raw basket-footer-section-root Fusion page into a {@link CartFooter}. */
export function extractCartFooter(rawPage: unknown): CartFooter {
  return {
    loyaltyPoints: extractLoyaltyPoints(rawPage),
    recommendations: extractRecommendations(rawPage),
  };
}

function extractLoyaltyPoints(rawPage: unknown): CartFooter["loyaltyPoints"] {
  const [label, value] = collectTexts(findNodeById(rawPage, LOYALTY_ID));
  return label && value ? { label, value } : null;
}

function extractRecommendations(rawPage: unknown): CartRecommendations | null {
  const header = findNodeById(rawPage, RECOMMENDATIONS_HEADER_ID);
  const tilesNode = findNodeById(rawPage, RECOMMENDATIONS_TILES_ID);
  if (!tilesNode) return null;

  const tiles: CartRecommendationTile[] = [];
  for (const child of asArray(tilesNode.children)) {
    const tile = extractTile(child);
    if (tile) tiles.push(tile);
  }
  if (tiles.length === 0) return null;

  // The header's first text is the title. The chevron after it is a separate text.
  const title = collectTexts(header)[0]?.text ?? "";
  return { title, pageId: RECOMMENDATIONS_PAGE_ID, tiles };
}

function extractTile(node: unknown): CartRecommendationTile | null {
  if (!isPmlNode(node) || typeof node.id !== "string" || !node.id.startsWith(TILE_ID_PREFIX)) {
    return null;
  }

  const image = findFirst(node, (candidate) => candidate.type === "IMAGE");
  const imageId = isPmlNode(image?.source) ? image.source.id : undefined;
  if (typeof imageId !== "string" || imageId === "") return null;

  const container = findFirst(node, (candidate) => typeof candidate.backgroundColor === "string");
  const backgroundColor = container?.backgroundColor;

  return {
    productId: node.id.slice(TILE_ID_PREFIX.length),
    imageId,
    backgroundColor: typeof backgroundColor === "string" ? backgroundColor : null,
    hasPromo:
      findFirst(
        node,
        (candidate) => candidate.type === "ICON" && candidate.iconKey === "percentage"
      ) !== null,
  };
}

// ─── PML tree helpers ────────────────────────────────────────────────────────

/** Finds the first node with the given id anywhere in the tree. */
function findNodeById(node: unknown, id: string): PmlNode | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findNodeById(item, id);
      if (found) return found;
    }
    return null;
  }
  if (!isPmlNode(node)) return null;
  if (node.id === id) return node;
  for (const value of Object.values(node)) {
    const found = findNodeById(value, id);
    if (found) return found;
  }
  return null;
}

/** Finds the first node, in document order, that matches the predicate. */
function findFirst(node: unknown, predicate: (candidate: PmlNode) => boolean): PmlNode | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findFirst(item, predicate);
      if (found) return found;
    }
    return null;
  }
  if (!isPmlNode(node)) return null;
  if (predicate(node)) return node;
  for (const value of Object.values(node)) {
    const found = findFirst(value, predicate);
    if (found) return found;
  }
  return null;
}

/** The RICH_TEXT nodes below a node, with their text and color, in document order. */
function collectTexts(node: unknown, out: CartFooterText[] = []): CartFooterText[] {
  if (Array.isArray(node)) {
    for (const item of node) collectTexts(item, out);
    return out;
  }
  if (!isPmlNode(node)) return out;

  if (node.type === "RICH_TEXT" && typeof node.markdown === "string") {
    const text = cleanMarkdown(node.markdown);
    const color = isPmlNode(node.textAttributes) ? node.textAttributes.color : undefined;
    if (text) out.push({ text, color: typeof color === "string" ? color : null });
    return out;
  }

  for (const value of Object.values(node)) collectTexts(value, out);
  return out;
}

/** Removes color tags such as `#(#B40117)` and bold or underline markers, and trims the text before and after. */
function cleanMarkdown(markdown: string): string {
  return markdown.replace(/#\([^)]+\)/g, "").trim().replace(/\*\*/g, "").replace(/__/g, "").trim();
}

function isPmlNode(value: unknown): value is PmlNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
