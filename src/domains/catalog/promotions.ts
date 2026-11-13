import type { RscNode, RscPageContent } from "../../pages/types";
import { PmlNode, analyticsContexts, childrenOf, cleanMarkdown, collectMarkdowns, findNode, findNodeByIdPrefix, walkNodes } from "../../pages/pml";
import { collectFusionProductTiles } from "./tiles";
import type { ProductTile, PromotionGroup, PromotionGroupProducts, PromotionSection, Promotions } from "./types";

/** The block of the promotions page whose children are the sections, between marker components. */
const LAYOUT_CONTENT_ID_PREFIX = "campaign-page-layout-content";
/** The deep link of a promotion group card: `app.picnic://store/page;id=promo-group-deep-dive,promo_group_id=<id>`. */
const PROMOTION_GROUP_ID = /[;,]promo_group_id=([^,&;]+)/;

// ─── Promotions page (RSC) ────────────────────────────────────────────────────

/** The component that holds streamed effects of an RSC page in its `data` prop. */
const STREAMING_DATA_COLLECTOR = "streaming-data-collector";
/** Effects that hold a section: a layout with a title and lists, or the personal promotions box. */
const SECTION_EFFECTS = new Set(["PAGE_LAYOUT", "PROMOBOX"]);

type RawRecord = Record<string, unknown>;
const asRecord = (value: unknown): RawRecord => (typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : {});
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/**
 * Reads the promotions page (`promo-page-root`) served as RSC. The page streams its sections as
 * effects in the `data` props of `streaming-data-collector` components (`{ component, componentIndex,
 * type: "RESOLVED" | "FAILED" }`). A section is a `PAGE_LAYOUT` effect with a `section-title` item and
 * lists or carousels of product tiles, promotion group items (`promo-group-list-item`) and campaign
 * cards; the personal promotions are a `PROMOBOX` effect with a title and tiles. Sections without
 * products or groups are left out.
 */
export function extractRscPromotions(content: RscPageContent): Promotions {
  const effects: { index: number; component: RawRecord }[] = [];
  const visit = (nodes: RscNode[]): void => {
    for (const node of nodes) {
      if (node.component === STREAMING_DATA_COLLECTOR && Array.isArray(node.props.data)) {
        for (const entry of node.props.data.map(asRecord)) {
          if (entry.type !== "RESOLVED") continue;
          effects.push({
            index: typeof entry.componentIndex === "number" ? entry.componentIndex : effects.length,
            component: asRecord(entry.component),
          });
        }
      }
      visit(node.children);
    }
  };
  visit(content.nodes);

  const sections = effects
    .sort((a, b) => a.index - b.index)
    .map(({ component }) => component)
    .filter((component) => SECTION_EFFECTS.has(String(component.effect_template_name)))
    .map(readRscSection)
    .filter((section) => section.products.length > 0 || section.groups.length > 0);
  return { sections };
}

function readRscSection(component: RawRecord): PromotionSection {
  const items = Array.isArray(component.items) ? component.items.map(asRecord) : [];
  const title = asString(component.title) ?? asString(items.find((item) => item.type === "section-title")?.title) ?? "";
  const products = new Map<string, ProductTile>();
  const groups = new Map<string, PromotionGroup>();

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value !== "object" || value === null) return;
    if (isProductTile(value)) {
      if (!products.has(value.id)) products.set(value.id, value);
      return;
    }
    const group = readRscGroup(value as RawRecord);
    if (group) {
      // A list item has the promotion; a campaign card for the same group has none.
      const known = groups.get(group.id);
      if (!known || (group.label && !known.label)) groups.set(group.id, group);
      return;
    }
    Object.values(value).forEach(visit);
  };
  visit(items);

  return { id: asString(component.id) ?? "", title, products: [...products.values()], groups: [...groups.values()] };
}

/**
 * Reads a promotion group list item (`promo-group-list-item`) or a campaign card (`campaign`) that
 * opens a promotion group page. The promotion is the item's badge, or else what its accessibility
 * label says after the name ("Vivera 2 voor €5").
 */
function readRscGroup(item: RawRecord): PromotionGroup | null {
  if (item.type !== "promo-group-list-item" && item.type !== "campaign") return null;
  const id = PROMOTION_GROUP_ID.exec(asString(item.deeplink) ?? "")?.[1];
  const name = asString(item.title)?.trim();
  if (!id || !name) return null;

  const accessibilityLabel = asString(item.accessibilityLabel);
  const label = asString(asRecord(item.badge).text) ?? (accessibilityLabel?.startsWith(`${name} `) ? accessibilityLabel.slice(name.length + 1).trim() || null : null);
  return { id, name, example: asString(item.subtitle)?.trim() || null, label };
}

// ─── Promotions page (Fusion) ─────────────────────────────────────────────────

/**
 * Reads the promotions page (`promo-page-root`, Fusion). Its layout block holds a component per
 * section with marker components around it; a section has a header, product tiles and cards for
 * promotions on several products. Sections without products or cards are left out.
 */
export function extractPromotions(page: unknown): Promotions {
  const layout = findNodeByIdPrefix(page, LAYOUT_CONTENT_ID_PREFIX);
  const sections = (layout ? childrenOf(layout) : [])
    // The markers around a section are PML components without content.
    .filter((child) => child.type !== "PML")
    .map(readSection)
    .filter((section) => section.products.length > 0 || section.groups.length > 0);
  return { sections };
}

function readSection(section: PmlNode): PromotionSection {
  const header = findNode(section, (n) => n.type === "RICH_TEXT" && typeof n.textType === "string" && n.textType.startsWith("HEADER") && typeof n.markdown === "string");
  return {
    id: typeof section.id === "string" ? section.id : "",
    title: header ? cleanMarkdown(header.markdown as string) : "",
    products: collectFusionProductTiles(section),
    groups: collectGroups(section),
  };
}

/**
 * Reads the promotion group cards: components whose analytics link to a `promo-group-deep-dive`
 * page. A card has the name, a line with an example product and a badge with the promotion. A
 * banner can link to the same group; the card is the component whose id ends with the group id.
 */
function collectGroups(section: PmlNode): PromotionGroup[] {
  const groups = new Map<string, { group: PromotionGroup; isCard: boolean }>();
  walkNodes(section, (node) => {
    const deeplink = analyticsContexts(node)
      .map((context) => context.data?.deeplink)
      .find((link): link is string => typeof link === "string" && link.includes("id=promo-group-deep-dive"));
    const id = deeplink ? PROMOTION_GROUP_ID.exec(deeplink)?.[1] : undefined;
    if (!id) return;
    const isCard = typeof node.id === "string" && node.id.endsWith(id);
    if (groups.get(id)?.isCard || (groups.has(id) && !isCard)) return;

    const label = badgeText(node);
    const [name, example] = collectMarkdowns(node)
      .map(cleanMarkdown)
      .filter((text) => text !== "" && text !== label);
    if (name) groups.set(id, { group: { id, name, example: example ?? null, label }, isCard });
  });
  return [...groups.values()].map(({ group }) => group);
}

/** The text of the innermost colored container with one text: the promotion badge of a card. */
function badgeText(card: PmlNode): string | null {
  let text: string | null = null;
  walkNodes(card, (node) => {
    if (node.type !== "CONTAINER" || typeof node.backgroundColor !== "string") return;
    const texts = collectMarkdowns(node);
    if (texts.length === 1) text = cleanMarkdown(texts[0]) || null;
  });
  return text;
}

/**
 * Reads a promotion group page (`promo-group-deep-dive`, RSC): its `promo-deep-dive-content`
 * component has the name and the product tiles.
 */
export function extractPromotionGroup(groupId: string, content: RscPageContent): PromotionGroupProducts {
  const props = findRscNode(content.nodes, "promo-deep-dive-content")?.props ?? {};
  const tiles = Array.isArray(props.sellableTiles) ? props.sellableTiles : [];
  return {
    id: groupId,
    name: typeof props.name === "string" ? props.name : "",
    products: tiles.filter(isProductTile),
  };
}

/** The page content has product tiles as {@link ProductTile}s already. */
const isProductTile = (item: unknown): item is ProductTile =>
  typeof item === "object" && item !== null && typeof (item as ProductTile).id === "string" && typeof (item as ProductTile).displayPrice === "number";

function findRscNode(nodes: RscNode[], component: string): RscNode | null {
  for (const node of nodes) {
    if (node.component === component) return node;
    const found = findRscNode(node.children, component);
    if (found) return found;
  }
  return null;
}
