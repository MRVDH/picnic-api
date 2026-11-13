import { cleanMarkdown, collectMarkdowns, findNode, walkNodes, type PmlNode } from "../../pages/pml";
import { collectFusionProductTiles } from "./tiles";
import type { ProductPageSection, ProductTile } from "./types";

/** A row of products on a theme page, e.g. "Nieuw". */
const SECTION_ID_PREFIX = "core-horizontal-selling-unit-section-localized";
/** The header of such a row. */
const SECTION_HEADER_ID_PREFIX = "horizontal-selling-unit-tiles-sub-header-pml";

type RawRecord = Record<string, unknown>;
const asRecord = (value: unknown): RawRecord => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : {});

/**
 * Reads a Fusion page that lists products, such as a theme page or a shop page (`fresh-market-wineshop`): its
 * title and its rows of product tiles, each product once. A page without rows gives one section without a title
 * with all its tiles.
 * @param {unknown} page The Fusion page.
 */
export function extractProductPage(page: unknown): { title: string | null; sections: ProductPageSection[] } {
  const layout = asRecord(asRecord(page).layout);
  const header = asRecord(layout.header ?? asRecord(page).header);
  const title = typeof header.title === "string" && header.title !== "" ? header.title : null;

  const rows: PmlNode[] = [];
  walkNodes(page, (node) => {
    if (typeof node.id === "string" && node.id.startsWith(SECTION_ID_PREFIX)) rows.push(node);
  });

  if (rows.length === 0) {
    const products = collectFusionProductTiles(page);
    return { title, sections: products.length > 0 ? [{ title: null, products }] : [] };
  }

  const seen = new Set<string>();
  const sections = rows.flatMap((row): ProductPageSection[] => {
    const products = collectFusionProductTiles(row).filter((tile: ProductTile) => !seen.has(tile.id));
    products.forEach((tile) => seen.add(tile.id));
    return products.length > 0 ? [{ title: rowTitle(row), products }] : [];
  });
  return { title, sections };
}

/** The text of the row's header, or `null` when it has none. */
function rowTitle(row: PmlNode): string | null {
  const header = findNode(row, (node) => typeof node.id === "string" && node.id.startsWith(SECTION_HEADER_ID_PREFIX));
  return header
    ? (collectMarkdowns(header)
        .map(cleanMarkdown)
        .find((text) => text !== "") ?? null)
    : null;
}
