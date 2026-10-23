import { cleanMarkdown, collectMarkdowns, findNodeById, findNodeByIdPrefix, walkNodes } from "../../pages/pml";
import { collectFusionProductTiles } from "./tiles";
import type { Favorites, FavoritesAisle, ProductTile } from "./types";

/** The tabs at the top of the favorites page, one per aisle: `aisles-segment-control-<AISLE>`. */
const AISLE_TAB_ID_PREFIX = "aisles-segment-control-";
/** The block with an aisle's header and products: `aisle-<AISLE>`. Aisles the page loads later have none. */
const AISLE_ID_PREFIX = "aisle-";
/** The button below a long aisle that opens the full list (`aisle-deep-dive`). */
const MORE_BUTTON_ID_PREFIX = "core-vertical-tiles-more-button-pml";

/**
 * Reads the favorites page (`purchases-page-root`, Fusion): the aisles from its tabs, and the
 * products the page shows per aisle. The page shows part of a long aisle with a button to the
 * full list, and loads the last aisles and the promotions within an aisle later (`SUSPENSE`
 * components); those are left out.
 */
export function extractFavorites(page: unknown): Favorites {
  const aisles: FavoritesAisle[] = [];
  walkNodes(page, (node) => {
    if (typeof node.id !== "string" || !node.id.startsWith(AISLE_TAB_ID_PREFIX)) return;
    const id = node.id.slice(AISLE_TAB_ID_PREFIX.length);
    if (aisles.some((aisle) => aisle.id === id)) return;

    const block = findNodeById(page, `${AISLE_ID_PREFIX}${id}`);
    aisles.push({
      id,
      title: cleanMarkdown(collectMarkdowns(node)[0] ?? "") || id,
      products: block ? collectFusionProductTiles(block, (n) => n.type === "SUSPENSE") : [],
      complete: block !== null && findNodeByIdPrefix(block, MORE_BUTTON_ID_PREFIX) === null,
    });
  });
  return { aisles };
}

/** Reads the full list of an aisle (`aisle-deep-dive`, Fusion): its product tiles. */
export function extractFavoritesInAisle(page: unknown): ProductTile[] {
  return collectFusionProductTiles(page);
}
