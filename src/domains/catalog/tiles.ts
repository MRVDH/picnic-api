import type { PriceRange } from "../../pages/fusion";
import { PmlNode, analyticsContexts, childrenOf, cleanMarkdown, collectMarkdowns, findNode, findNodeById, stripColorTags } from "../../pages/pml";
import type { ProductTile } from "./types";

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === "number" ? value : null);

/** The analytics context of a tile's promotion: its label and the original price. */
const PROMOTION_SCHEMA = "iglu:tech.picnic.snowplow.analytics/promotion/";
/** The layer over the tile image that holds its labels. */
const LABEL_CONTAINER_ID = "selling-unit-label-container";

/** Whether a node of a Fusion page is a product tile: a PML component with `SELLING_UNIT_TILE` content. */
export const isFusionProductTile = (node: PmlNode): boolean => node.type === "PML" && asRecord(node.content).type === "SELLING_UNIT_TILE";

/**
 * Reads a product tile of a Fusion page (promotions, favorites) into the same {@link ProductTile}
 * the RSC pages give. The selling unit has the id, price, image and package size; the tile's info
 * column (the stack that opens the product page) has the name as shown, the quality cue above it
 * and the brand below the price. Fusion tiles have no unit price or order count.
 * Returns `null` for a tile without a selling unit.
 */
export function readFusionProductTile(tile: PmlNode): ProductTile | null {
  const unit = asRecord(asRecord(tile.content).sellingUnit);
  const id = asString(unit.id);
  const catalogName = asString(unit.name);
  if (!id || !catalogName) return null;

  const promotion = asRecord(analyticsContexts(tile).find((context) => context.schema?.startsWith(PROMOTION_SCHEMA))?.data);
  const unitQuantity = asString(unit.unit_quantity) ?? "";
  const info = readInfoColumn(tile.pml, unitQuantity);
  const priceRanges = asArray(unit.price_ranges).flatMap((value): PriceRange[] => {
    const range = asRecord(value);
    const price = asNumber(range.price);
    const fromQuantity = asNumber(range.from_quantity);
    return price !== null && fromQuantity !== null ? [{ price, from_quantity: fromQuantity }] : [];
  });
  const promotionLabel = asString(promotion.promotion_label);

  return {
    id,
    name: info.name ?? catalogName,
    namePrefix: info.namePrefix,
    brand: info.brand,
    qualityCue: info.qualityCue,
    imageId: asString(unit.image_id),
    displayPrice: asNumber(unit.display_price) ?? 0,
    originalPrice: promotion.show_strikethrough_price === true ? asNumber(promotion.strikethrough_price) : null,
    unitPrice: null,
    // One tier means the price doesn't depend on the quantity.
    priceRanges: priceRanges.length > 1 ? priceRanges : null,
    unitQuantity,
    labels: promotionLabel ? [{ position: labelPosition(tile.pml, promotionLabel), type: "PROMO", text: promotionLabel }] : [],
    isUnavailable: asArray(unit.decorators).some((decorator) => asRecord(decorator).type === "UNAVAILABLE"),
    numberOfOrders: null,
  };
}

/**
 * Returns the product tiles in a tree in document order, each product once.
 * @param skip Subtrees to leave out, e.g. content that the page loads later.
 */
export function collectFusionProductTiles(node: unknown, skip: (node: PmlNode) => boolean = () => false): ProductTile[] {
  const tiles = new Map<string, ProductTile>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value !== "object" || value === null) return;
    const candidate = value as PmlNode;
    if (skip(candidate)) return;
    if (isFusionProductTile(candidate)) {
      const tile = readFusionProductTile(candidate);
      if (tile && !tiles.has(tile.id)) tiles.set(tile.id, tile);
      return;
    }
    Object.values(candidate).forEach(visit);
  };
  visit(node);
  return [...tiles.values()];
}

type InfoColumn = { name: string | null; namePrefix: string | null; brand: string | null; qualityCue: string | null };

/**
 * Reads the info column: an optional quality cue row, the name, the prices, then rows with the
 * brand (when the tile shows one) and the package size.
 */
function readInfoColumn(pml: unknown, unitQuantity: string): InfoColumn {
  const opensProduct = findNode(pml, (n) => n.type === "TOUCHABLE" && asRecord(n.onPress).actionType === "OPEN");
  const column = opensProduct ? findNode(opensProduct.child, (n) => n.type === "STACK") : null;
  const rows = column ? childrenOf(column) : [];
  const nameIndex = rows.findIndex((row) => row.type === "RICH_TEXT");
  if (nameIndex < 0) return { name: null, namePrefix: null, brand: null, qualityCue: null };

  // A bold start of the name is its prefix, e.g. "**Bio** citroenen".
  const shownName = stripColorTags(collectMarkdowns(rows[nameIndex])[0] ?? "");
  const prefix = /^\*\*(.+?)\*\*\s*/.exec(shownName);
  const name = cleanMarkdown(prefix ? shownName.slice(prefix[0].length) : shownName) || null;

  const firstText = (row: PmlNode | undefined): string | null => (row ? cleanMarkdown(collectMarkdowns(row)[0] ?? "") || null : null);
  // The first row after the prices is the brand, unless it is the row with the package size.
  const rowAfterPrices = rows.slice(nameIndex + 1).find((row) => row.type === "STACK");
  const isQuantityRow = rowAfterPrices ? collectMarkdowns(rowAfterPrices).some((text) => cleanMarkdown(text) === unitQuantity) : false;

  return {
    name,
    namePrefix: prefix ? cleanMarkdown(prefix[1]) || null : null,
    brand: isQuantityRow ? null : firstText(rowAfterPrices),
    qualityCue: nameIndex > 0 ? firstText(rows[0]) : null,
  };
}

/** Where the promotion label sits on the image, e.g. "bottomLeft". */
function labelPosition(pml: unknown, label: string): string {
  const placed = findNode(
    findNodeById(pml, LABEL_CONTAINER_ID),
    (n) => typeof n.absolutePosition === "object" && collectMarkdowns(n).some((text) => cleanMarkdown(text) === label),
  );
  // The app puts promotion labels bottom left.
  if (!placed) return "bottomLeft";
  const position = asRecord(placed.absolutePosition);
  return `${"top" in position ? "top" : "bottom"}${"right" in position && !("left" in position) ? "Right" : "Left"}`;
}
