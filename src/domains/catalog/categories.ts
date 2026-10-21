import type { RscNode, RscPageContent } from "../../pages/types";
import { extractFilters } from "./helpers";
import type { CategoryLink, CategoryLinkTarget, CategoryProducts, CategorySection, ProductTile, SearchSection, Subcategories } from "./types";

type RscRecord = Record<string, unknown>;

const asRecord = (value: unknown): RscRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RscRecord) : null;
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/** Deep link pages the category lists open, and what they show. */
const TARGET_TYPES: Record<string, Exclude<CategoryLinkTarget["type"], "page">> = {
  "subcategory-page": "subcategories",
  "category-product-overview": "products",
  "promotion-category-page": "promotions",
};

/** The first node of a component (by module name) in an RSC component tree. */
function findNode(nodes: RscNode[], component: string): RscNode | null {
  for (const node of nodes) {
    if (node.component === component) return node;
    const found = findNode(node.children, component);
    if (found) return found;
  }
  return null;
}

/** What a deep link like `app.picnic://store/page;id=subcategory-page,category_id=21724` opens. */
function readTarget(deeplink: string): CategoryLinkTarget {
  const [pageId, ...params] = (deeplink.split(";id=")[1] ?? "").split(",");
  const type = TARGET_TYPES[pageId];
  const categoryId = params.find((param) => param.startsWith("category_id="))?.slice("category_id=".length);
  return type && categoryId ? { type, categoryId: decodeURIComponent(categoryId) } : { type: "page" };
}

/** Reads a list item (`row-item`) of a category list. */
function readLink(item: unknown): CategoryLink | null {
  const entry = asRecord(item);
  const name = asString(entry?.title);
  const deeplink = asString(entry?.deeplink);
  if (!entry || !name || !deeplink) return null;
  return {
    name,
    imageId: asString(entry.image),
    label: asString(asRecord(entry.label)?.title),
    deeplink,
    target: readTarget(deeplink),
  };
}

/**
 * Reads the category tree (`category-tree-root`): one list with links (promotions, recipes, then
 * the categories), where a `section-title` item starts a new section.
 */
export function extractCategoryTree(content: RscPageContent): CategorySection[] {
  const sections: CategorySection[] = [{ title: null, links: [] }];
  for (const item of asArray(findNode(content.nodes, "vertical-list")?.props.items)) {
    const entry = asRecord(item);
    if (entry?.type === "section-title") {
      sections.push({ title: asString(entry.title), links: [] });
      continue;
    }
    const link = readLink(item);
    if (link) sections[sections.length - 1].links.push(link);
  }
  return sections.filter((section) => section.links.length > 0);
}

/** Reads a category's subcategory list (`subcategory-page`). */
export function extractSubcategories(categoryId: string, content: RscPageContent): Subcategories {
  const list = findNode(content.nodes, "category-list");
  return {
    categoryId,
    title: asString(list?.props.title) ?? "",
    links: asArray(list?.props.items).flatMap((item) => readLink(item) ?? []),
  };
}

/** The product tiles of a section; the page content has them as {@link ProductTile}s already. */
const isProductTile = (item: unknown): item is ProductTile =>
  typeof asRecord(item)?.id === "string" && typeof asRecord(item)?.name === "string" && typeof asRecord(item)?.displayPrice === "number";

/**
 * Reads a product overview (`category-product-overview`, `promotion-category-page`): the sections
 * of products and the filters, from the same components as the search results.
 */
export function extractCategoryProducts(categoryId: string, content: RscPageContent): CategoryProducts {
  const items = findNode(content.nodes, "items")?.props;
  const filterBar = findNode(content.nodes, "filter-bar")?.props;
  const productIdsByFacetId: Record<string, string[]> = {};
  for (const [facetId, ids] of Object.entries(asRecord(findNode(content.nodes, "context")?.props.entityIdsByFacetId) ?? {})) {
    productIdsByFacetId[facetId] = asArray(ids).filter((id): id is string => typeof id === "string");
  }

  const sections: SearchSection[] = asArray(items?.sections).map((value) => {
    const section = asRecord(value) ?? {};
    return {
      id: asString(section.id) ?? "",
      type: asString(section.type) ?? "",
      title: section.shouldShowHeader ? asString(section.headerName) : null,
      products: asArray(section.items).filter(isProductTile),
    };
  });

  return {
    categoryId,
    title: asString(findNode(content.nodes, "page-header")?.props.title) ?? "",
    results: {
      sections,
      visualFilters: extractFilters(filterBar?.visualFilters),
      powerFilters: extractFilters(filterBar?.powerFilters ?? items?.powerFilters),
      textualFilters: extractFilters(filterBar?.textualFilters),
      productIdsByFacetId,
      sortingOptions: [],
      selectedSorting: "RELEVANCE",
    },
  };
}
