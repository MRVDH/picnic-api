import type { RscNode, RscPageContent } from "../../pages/types";
import { PmlNode, analyticsContexts, childrenOf, cleanMarkdown, collectMarkdowns, findNode, findNodeByIdPrefix, walkNodes } from "../../pages/pml";
import { collectFusionProductTiles } from "./tiles";
import type { ProductTile, PromotionGroup, PromotionGroupProducts, PromotionSection, Promotions } from "./types";

/** The block of the promotions page whose children are the sections, between marker components. */
const LAYOUT_CONTENT_ID_PREFIX = "campaign-page-layout-content";
/** The deep link of a promotion group card: `app.picnic://store/page;id=promo-group-deep-dive,promo_group_id=<id>`. */
const PROMOTION_GROUP_ID = /[;,]promo_group_id=([^,&;]+)/;

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
