import type { FusionPage } from "../../pages/fusion";
import type { RscNode, RscPageContent } from "../../pages/types";
import { analyticsContexts, cleanMarkdown, findNode, PmlNode, walkNodes } from "../../pages/pml";
import type {
  RecipeCategory,
  RecipeCategoryGroup,
  RecipeCategoryLink,
  RecipeCategorySection,
  RecipeImageType,
  RecipeListSection,
  RecipeOverview,
  RecipeSummary,
} from "./types";

const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/";
const AISLE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/aisle/jsonschema/";
const PAGE_SECTION_SCHEMA = "iglu:tech.picnic.snowplow.analytics/page_section/jsonschema/";
const PML_COMPONENT_SCHEMA = "iglu:tech.picnic.snowplow.analytics/pml_component/jsonschema/";

/** A deep link to a recipe category or a group of categories. */
const CATEGORY_LINK = /id=meals-category(-group)?-page,(?:category_id|group_name)=([^,&]+)/;

/** Minutes in a time such as "20 min", "15 + 25 min" (preparation plus waiting) or "1 uur 10 min". */
export function parseMinutes(text: string): number | null {
  const sum = text.match(/^(\d+(?:\s*\+\s*\d+)*)\s*min/i)?.[1];
  if (sum) return sum.split("+").reduce((total, part) => total + Number(part.trim()), 0);
  const hours = text.match(/(\d+)\s*(?:uur|u|std|h)\b/i)?.[1];
  const minutes = text.match(/(\d+)\s*min/i)?.[1];
  if (hours === undefined && minutes === undefined) return null;
  return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
}

/** The recipe analytics context of a tile, or undefined. */
function recipeContext(tile: PmlNode): Record<string, unknown> | undefined {
  return analyticsContexts(tile).find((c) => c.schema?.startsWith(RECIPE_SCHEMA) && typeof c.data?.recipe_id === "string")?.data;
}

/** The texts a tile shows, in order. Hidden parts (`isHidden`, shown on a condition) are left out. */
function visibleTexts(node: unknown, texts: { markdown: string; textType: unknown }[] = []) {
  if (Array.isArray(node)) node.forEach((child) => visibleTexts(child, texts));
  else if (typeof node === "object" && node !== null) {
    const record = node as PmlNode;
    if (record.isHidden !== undefined && record.isHidden !== false) return texts;
    if (record.type === "RICH_TEXT" && typeof record.markdown === "string") texts.push({ markdown: record.markdown, textType: record.textType });
    for (const [key, value] of Object.entries(record)) if (key !== "analytics") visibleTexts(value, texts);
  }
  return texts;
}

/**
 * Reads a recipe tile of a Fusion page (cookbook, cookbook home, saved recipes). The tile shows
 * labels on the image, the name, then the subtitle (`SUBTITLE2`) and the tags ("20 min", "Vegan").
 */
export function readRecipeTile(tile: PmlNode): RecipeSummary | null {
  const recipe = recipeContext(tile);
  if (!recipe) return null;
  const texts = visibleTexts(tile.pml).map((t) => ({ text: cleanMarkdown(t.markdown), textType: t.textType })).filter((t) => t.text);
  const analyticsName = typeof recipe.recipe_name === "string" ? recipe.recipe_name.trim() : "";
  const shownName = analyticsName ? texts.findIndex((t) => t.text === analyticsName) : -1;
  const nameIndex = shownName >= 0 ? shownName : texts.findIndex((t) => t.textType === "SUBTITLE1");
  const name = analyticsName || (nameIndex >= 0 ? texts[nameIndex].text : "");
  const after = nameIndex >= 0 ? texts.slice(nameIndex + 1).filter((t) => t.text !== ">") : [];
  const subtitle = after.find((t) => t.textType === "SUBTITLE2")?.text ?? null;
  const tags = after.filter((t) => t.textType !== "SUBTITLE2").map((t) => t.text);
  const image = findNode(tile.pml, (n) => n.type === "IMAGE" && typeof (n.source as PmlNode | undefined)?.id === "string");
  const imageType = recipe.recipe_image_type ?? recipe.image_type;

  return {
    id: recipe.recipe_id as string,
    name,
    imageType: typeof imageType === "string" ? (imageType as RecipeImageType) : null,
    imageId: image ? ((image.source as PmlNode).id as string) : null,
    subtitle,
    tags,
    cookingTimeMinutes: firstMinutes(tags),
  };
}

const firstMinutes = (tags: string[]): number | null =>
  tags.map(parseMinutes).find((minutes): minutes is number => minutes !== null) ?? null;

/** Every recipe tile of a Fusion page in order, each recipe once. */
export function extractRecipeTiles(page: unknown): RecipeSummary[] {
  const recipes = new Map<string, RecipeSummary>();
  walkTiles(page, (tile) => {
    const recipe = readRecipeTile(tile);
    if (recipe && !recipes.has(recipe.id)) recipes.set(recipe.id, recipe);
  });
  return [...recipes.values()];
}

/** Visits the recipe tiles (PML nodes with a recipe analytics context), not looking inside them. */
function walkTiles(node: unknown, visit: (tile: PmlNode) => void): void {
  if (Array.isArray(node)) return node.forEach((child) => walkTiles(child, visit));
  if (typeof node !== "object" || node === null) return;
  const record = node as PmlNode;
  if (record.type === "PML" && recipeContext(record)) return visit(record);
  Object.values(record).forEach((child) => walkTiles(child, visit));
}

/** Reads a category link from its deep link, or null for other links. */
function categoryLink(deeplink: string, name: string, imageId: string | null): RecipeCategoryLink | null {
  const match = deeplink.match(CATEGORY_LINK);
  if (!match) return null;
  return { type: match[1] ? "group" : "category", id: decodeURIComponent(match[2]), name, imageId };
}

/**
 * Reads the cookbook home (`meals-page-root`). Its recipe rows tag each tile with the row
 * ("assortment aisle") and the selected pill; the category tree has list items that link to
 * categories, under a heading ("page section").
 */
export function extractRecipeOverview(page: FusionPage): RecipeOverview {
  const sections = new Map<string, RecipeListSection & { rank: number; ids: Set<string> }>();
  walkTiles(page, (tile) => {
    const aisle = analyticsContexts(tile).find((c) => c.schema?.startsWith(AISLE_SCHEMA))?.data;
    const recipe = readRecipeTile(tile);
    if (!aisle || !recipe || typeof aisle.assortment_aisle !== "string") return;
    const key = `${aisle.aisle_ranking}:${aisle.assortment_aisle}`;
    let section = sections.get(key);
    if (!section) {
      const pill = typeof aisle.pill_display_name === "string" ? aisle.pill_display_name : null;
      section = { title: aisle.assortment_aisle, pill, recipes: [], rank: Number(aisle.aisle_ranking ?? sections.size), ids: new Set() };
      sections.set(key, section);
    }
    if (!section.ids.has(recipe.id)) {
      section.ids.add(recipe.id);
      section.recipes.push(recipe);
    }
  });

  const categorySections = new Map<string, RecipeCategorySection>();
  walkNodes(page, (node) => {
    if (node.type !== "PML") return;
    const contexts = analyticsContexts(node);
    const deeplink = contexts.find((c) => c.schema?.startsWith(PML_COMPONENT_SCHEMA))?.data?.deeplink;
    const heading = contexts.find((c) => c.schema?.startsWith(PAGE_SECTION_SCHEMA))?.data?.name;
    if (typeof deeplink !== "string" || typeof heading !== "string") return;
    const component = (node.pml as PmlNode | undefined)?.component as PmlNode | undefined;
    const name = typeof component?.accessibilityLabel === "string" ? component.accessibilityLabel : "";
    const image = findNode(component, (n) => n.type === "IMAGE");
    const link = categoryLink(deeplink, name, typeof (image?.source as PmlNode | undefined)?.id === "string" ? ((image!.source as PmlNode).id as string) : null);
    if (!link || !name) return;
    const section = categorySections.get(heading) ?? { title: heading, categories: [] };
    if (!section.categories.some((c) => c.type === link.type && c.id === link.id)) section.categories.push(link);
    categorySections.set(heading, section);
  });

  return {
    sections: [...sections.values()].sort((a, b) => a.rank - b.rank).map(({ title, pill, recipes }) => ({ title, pill, recipes })),
    categorySections: [...categorySections.values()],
  };
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);

/** The first node of a component (by module name) in an RSC component tree. */
function findRscNode(nodes: RscNode[], component: string): RscNode | null {
  for (const node of nodes) {
    if (node.component === component) return node;
    const found = findRscNode(node.children, component);
    if (found) return found;
  }
  return null;
}

/** Reads a recipe tile (`selling-group` item) of an RSC page. */
function readRscRecipeTile(item: unknown): RecipeSummary | null {
  const tile = asRecord(item);
  const id = asString(tile?.id);
  if (!tile || !id || tile.sellableType !== "SELLING_GROUP") return null;
  const text = asRecord(tile.text);
  const tags = (Array.isArray(text?.tags) ? text!.tags : []).flatMap((tag) => asString(asRecord(tag)?.text) ?? []);
  return {
    id,
    name: asString(asRecord(text?.title)?.text) ?? "",
    imageType: null,
    imageId: asString(asRecord(tile.image)?.imageId),
    subtitle: asString(asRecord(text?.subtitle)?.text),
    tags,
    cookingTimeMinutes: firstMinutes(tags),
  };
}

/** Reads a category page (`meals-category-page`): a page header and a list of recipe tiles. */
export function extractRecipeCategory(categoryId: string, content: RscPageContent): RecipeCategory {
  const items = findRscNode(content.nodes, "vertical-list")?.props.items;
  return {
    id: categoryId,
    title: asString(findRscNode(content.nodes, "page-header")?.props.title) ?? "",
    recipes: (Array.isArray(items) ? items : []).flatMap((item) => readRscRecipeTile(item) ?? []),
  };
}

/** Reads a category group page (`meals-category-group-page`): a titled list of category links. */
export function extractRecipeCategoryGroup(name: string, content: RscPageContent): RecipeCategoryGroup {
  const list = findRscNode(content.nodes, "category-list");
  const items = list?.props.items;
  return {
    name,
    title: asString(list?.props.title) ?? name,
    categories: (Array.isArray(items) ? items : []).flatMap((item) => {
      const entry = asRecord(item);
      const deeplink = asString(entry?.deeplink);
      const link = deeplink ? categoryLink(deeplink, asString(entry?.title) ?? "", asString(entry?.image)) : null;
      return link ? [link] : [];
    }),
  };
}
