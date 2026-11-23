import { cleanMarkdown, findNode, findNodeById, walkNodes } from "../../pages/pml";
import { asArray, isRecord } from "../../raw";
import { CartFooter, CartFooterText, CartRecommendationTile, CartRecommendations } from "./types";

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
  if (!isRecord(node) || typeof node.id !== "string" || !node.id.startsWith(TILE_ID_PREFIX)) {
    return null;
  }

  const image = findNode(node, (candidate) => candidate.type === "IMAGE");
  const imageId = isRecord(image?.source) ? image.source.id : undefined;
  if (typeof imageId !== "string" || imageId === "") return null;

  const container = findNode(node, (candidate) => typeof candidate.backgroundColor === "string");
  const backgroundColor = container?.backgroundColor;

  return {
    productId: node.id.slice(TILE_ID_PREFIX.length),
    imageId,
    backgroundColor: typeof backgroundColor === "string" ? backgroundColor : null,
    hasPromo: findNode(node, (candidate) => candidate.type === "ICON" && candidate.iconKey === "percentage") !== null,
  };
}

/** The RICH_TEXT nodes below a node, with their text and color, in document order. */
function collectTexts(node: unknown): CartFooterText[] {
  const texts: CartFooterText[] = [];
  walkNodes(node, (n) => {
    if (n.type !== "RICH_TEXT" || typeof n.markdown !== "string") return;
    const text = cleanMarkdown(n.markdown);
    const color = isRecord(n.textAttributes) ? n.textAttributes.color : undefined;
    if (text) texts.push({ text, color: typeof color === "string" ? color : null });
  });
  return texts;
}
