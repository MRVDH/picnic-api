import { FusionPage, PriceRange } from "../../types/fusion";
import {
  accordionItems,
  ancestorsOf,
  childrenOf,
  cleanMarkdown,
  collectMarkdowns,
  collectNutritionRows,
  findNode,
  findNodeById,
  findPmlComponent,
  PmlNode,
  stripColorTags,
} from "../../helpers/pml";
import type { NutritionRow } from "../catalog/types";
import { parseMinutes, readRecipeTile } from "./lists";
import {
  RecipeAllergens,
  RecipeDetails,
  RecipeIngredient,
  RecipeSegment,
  RecipeSummary,
  RecipeTime,
  UserDefinedRecipeReferenceImage,
  UserDefinedRecipeSuggestedImage,
} from "./types";

const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/";
const SEGMENT_SCHEMA = "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/";
const PROMOTION_SCHEMA = "iglu:tech.picnic.snowplow.analytics/promotion/jsonschema/";

type AnalyticsContext = { schema?: string; data?: Record<string, any> };

/** Recursively visit every object in a JSON tree. */
const walkObjects = (node: unknown, visit: (obj: Record<string, any>) => void): void => {
  if (Array.isArray(node)) {
    node.forEach((child) => walkObjects(child, visit));
  } else if (node && typeof node === "object") {
    visit(node as Record<string, any>);
    Object.values(node as Record<string, unknown>).forEach((child) => walkObjects(child, visit));
  }
};

const plainText = (markdown: string): string =>
  markdown.replace(/#\([^)]*\)/g, "").replace(/\*\*/g, "").replace(/\u00a0/g, " ").trim();

const textByType = (node: unknown, textType: string): string | null => {
  let result: string | null = null;
  walkObjects(node, (obj) => {
    if (!result && obj.type === "RICH_TEXT" && obj.textType === textType && typeof obj.markdown === "string") {
      result = plainText(obj.markdown) || null;
    }
  });
  return result;
};

/**
 * Extracts a cookbook segment in tile order, deduplicated by recipe id.
 * Catalog tiles often omit recipe_name in analytics; their SUBTITLE1 contains it.
 * Image source is null when the tile does not supply that metadata.
 */
export function extractRecipes(page: FusionPage, segmentType: RecipeSegment): RecipeSummary[] {
  const byId = new Map<string, RecipeSummary>();
  walkObjects(page, (obj) => {
    const contexts: AnalyticsContext[] | undefined = obj.analytics?.contexts ?? obj.contexts;
    if (!Array.isArray(contexts)) return;
    const segment = contexts.find((c) => c.schema?.startsWith(SEGMENT_SCHEMA));
    if (segment?.data?.segment_type !== segmentType) return;
    const recipe = contexts.find((c) => c.schema?.startsWith(RECIPE_SCHEMA))?.data;
    if (typeof recipe?.recipe_id !== "string") return;
    const previous = byId.get(recipe.recipe_id);
    const tile = readRecipeTile(obj);
    byId.set(recipe.recipe_id, {
      id: recipe.recipe_id,
      name: previous?.name || recipe.recipe_name || tile?.name || "",
      imageType: previous?.imageType ?? recipe.recipe_image_type ?? recipe.image_type ?? null,
      imageId: previous?.imageId ?? tile?.imageId ?? null,
      subtitle: previous?.subtitle ?? tile?.subtitle ?? null,
      tags: previous?.tags.length ? previous.tags : (tile?.tags ?? []),
      cookingTimeMinutes: previous?.cookingTimeMinutes ?? tile?.cookingTimeMinutes ?? null,
    });
  });
  return [...byId.values()];
}

/** Compatibility helper for the user's own cookbook segment. */
export function extractUserDefinedRecipes(page: FusionPage): RecipeSummary[] {
  return extractRecipes(page, "USER_DEFINED_RECIPES");
}

/** What an ingredient tile shows about the product it currently holds. */
type IngredientTile = {
  name: string | null;
  brand: string | null;
  /** The product the tile shows, or null when the tile doesn't say. */
  sellingUnitId: string | null;
  imageId: string | null;
  unitQuantity: string | null;
  neededText: string | null;
  promotionLabel: string | null;
  /** A text in the info column instead of the prices, e.g. "Morgen niet op voorraad". */
  notice: string | null;
};

const markdownText = (node: PmlNode | undefined): string | null =>
  typeof node?.markdown === "string" ? cleanMarkdown(node.markdown) || null : null;

/**
 * Reads an ingredient tile. Its info column holds a stack with the name (`SUBTITLE1`) and the
 * brand, the prices, and a row with the package size and the needed amount ("(150 g nodig)").
 */
function readIngredientTile(tile: PmlNode, contexts: AnalyticsContext[], unit: Record<string, any> | undefined): IngredientTile {
  const nameNode = findNode(tile.pml, (n) => n.type === "RICH_TEXT" && n.textType === "SUBTITLE1" && typeof n.markdown === "string");
  // The nearest stack around the name holds the name and the brand; the one around it, the info column.
  const [nameStack, infoColumn] = nameNode ? ancestorsOf(tile.pml, nameNode).filter((n) => n.type === "STACK") : [];
  const textRow = (infoColumn ? childrenOf(infoColumn) : [])
    .filter((n) => n.type === "STACK" && childrenOf(n).length > 0 && childrenOf(n).every((c) => c.type === "RICH_TEXT" && typeof c.markdown === "string"))
    .pop();
  const rowTexts = textRow ? childrenOf(textRow) : [];
  const image = findNode(findNodeById(tile.pml, "selling-unit-image"), (n) => n.type === "IMAGE");
  const imageSource = image?.source as PmlNode | undefined;
  const promotion = contexts.find((c) => c.schema?.startsWith(PROMOTION_SCHEMA))?.data;

  return {
    name: markdownText(nameNode ?? undefined),
    brand: nameStack ? findBrand(childrenOf(nameStack).slice(1)) : null,
    sellingUnitId: typeof unit?.selling_unit_id === "string" ? unit.selling_unit_id : null,
    imageId: typeof imageSource?.id === "string" ? imageSource.id : null,
    unitQuantity: markdownText(rowTexts[0]),
    neededText: markdownText(rowTexts[1]),
    promotionLabel: typeof promotion?.promotion_label === "string" ? promotion.promotion_label : null,
    notice: markdownText((infoColumn ? childrenOf(infoColumn) : []).find((n) => n.type === "RICH_TEXT")),
  };
}

const findBrand = (nodes: PmlNode[]): string | null =>
  markdownText(findNode(nodes, (n) => n.type === "RICH_TEXT" && typeof n.markdown === "string") ?? undefined);

/** Ingredient tiles keyed by component id, including discontinued products. */
function extractIngredientTiles(page: unknown): Map<string, IngredientTile> {
  const tiles = new Map<string, IngredientTile>();
  walkObjects(page, (obj) => {
    if (obj.type !== "PML" || typeof obj.id !== "string" || !obj.id.includes("selling-unit-tile")) return;
    const contexts: AnalyticsContext[] = obj.analytics?.contexts ?? [];
    const recipe = contexts.find((c) => c.schema?.startsWith(RECIPE_SCHEMA))?.data;
    const units = recipe?.selling_units;
    const unit = Array.isArray(units) && units.length === 1 ? units[0] : undefined;
    // Discontinued tiles omit analytics. Their edit link still carries the
    // component id; read the URL as text without executing its JavaScript.
    const ingredientId = unit ? unit.ingredient_id : JSON.stringify(obj.pml ?? {}).match(/ingredient_id=([a-f0-9-]+)&/)?.[1];
    if (typeof ingredientId === "string" && !tiles.has(ingredientId)) tiles.set(ingredientId, readIngredientTile(obj, contexts, unit));
  });
  return tiles;
}

/** An ingredient in the page state: its type, availability and the prices of its products. */
type IngredientState = {
  ingredientId: string;
  ingredientType?: string;
  isAvailable?: boolean;
  sellingUnits?: Record<string, { price?: number; referencePrice?: number; priceRanges?: PriceRange[] }>;
};

/** The ingredients in the `sellableContentState` state boundary, keyed by component id. */
function extractIngredientStates(page: unknown): Map<string, IngredientState> {
  const states = new Map<string, IngredientState>();
  walkObjects(page, (obj) => {
    if (obj.type !== "STATE_BOUNDARY" || obj.id !== "sellableContentState") return;
    for (const ingredient of obj.state?.ingredientsState ?? []) {
      if (typeof ingredient?.ingredientId === "string") states.set(ingredient.ingredientId, ingredient);
    }
  });
  return states;
}

/** The ingredients the app selects when the page opens (`sellablePageState`), or null. */
function extractDefaultSelectedIngredientIds(page: unknown): Set<string> | null {
  const state = findNode(page, (n) => n.type === "STATE_BOUNDARY" && n.id === "sellablePageState")?.state as PmlNode | undefined;
  const ids = state?.defaultSelectedIngredientIds;
  return Array.isArray(ids) ? new Set(ids.filter((id): id is string => typeof id === "string")) : null;
}

/** One ingredient in the allergen expressions: its component id and allergen codes. */
type AllergenComponent = {
  id: string;
  excluded?: boolean;
  transformations?: { allergy_info?: { allergy_info_contains?: string[] | null; allergy_info_may_contain?: string[] | null } };
};

/**
 * Reads the allergens per ingredient. The allergen section shows or hides each allergen with an
 * expression that embeds every ingredient's allergen codes (`const components = [...]`); the
 * expression for the "may contain" text maps the codes to names (`const translationsMap = {...}`).
 * Both are read as data, without running the expressions.
 */
function extractAllergensByIngredient(page: unknown): Map<string, RecipeAllergens> {
  let components: AllergenComponent[] = [];
  let names: Record<string, string> = {};
  walkObjects(page, (obj) => {
    if (obj.type !== "EXPRESSION" || typeof obj.expression !== "string") return;
    if (components.length === 0) {
      const list = obj.expression.match(/const components = (\[.*?\]);\n/s)?.[1];
      components = parseJson<AllergenComponent[]>(list) ?? [];
    }
    if (Object.keys(names).length === 0) {
      // A JavaScript object literal with unquoted keys: `{ CELERY: "Selderij", ... }`.
      const map = obj.expression.match(/const translationsMap = (\{[^}]*\});/)?.[1];
      names = parseJson<Record<string, string>>(map?.replace(/([A-Z_]+):/g, '"$1":')) ?? {};
    }
  });

  const name = (code: string) => names[code] ?? code;
  return new Map(
    components
      .filter((component) => typeof component.id === "string" && !component.excluded)
      .map((component) => {
        const info = component.transformations?.allergy_info;
        return [component.id, { contains: (info?.allergy_info_contains ?? []).map(name), mayContain: (info?.allergy_info_may_contain ?? []).map(name) }];
      })
  );
}

function parseJson<T>(text: string | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** The allergens of the given ingredients, each listed once, in ingredient order. */
function combineAllergens(allergens: RecipeAllergens[]): RecipeAllergens {
  return {
    contains: [...new Set(allergens.flatMap((a) => a.contains))],
    mayContain: [...new Set(allergens.flatMap((a) => a.mayContain))],
  };
}

/** The times below the heading: stacks with a value and a label, e.g. "20 min" and "Totaal". */
function extractTimes(page: unknown): RecipeTime[] {
  const component = findPmlComponent(findNodeById(page, "selling-group-time-and-price-section"));
  return (component ? childrenOf(component) : []).flatMap((column) => {
    const texts = childrenOf(column).filter((c) => c.type === "RICH_TEXT" && typeof c.markdown === "string");
    return texts.length === 2 ? [{ value: cleanMarkdown(texts[0].markdown as string), label: cleanMarkdown(texts[1].markdown as string) }] : [];
  });
}

/** The heading: an optional tag, the name (a header container) and an optional description. */
function extractHeading(page: unknown): { tag: string | null; description: string | null } {
  const component = findPmlComponent(findNodeById(page, "selling-group-details-heading"));
  const parts = component ? childrenOf(component) : [];
  const titleIndex = parts.findIndex((n) => n.type === "CONTAINER");
  if (titleIndex < 0) return { tag: null, description: null };
  return { tag: markdownText(parts.slice(0, titleIndex).pop()), description: markdownText(parts[titleIndex + 1]) };
}

/** The steps: stacks with a "Stap 1" header and the step text. */
function extractSteps(page: unknown): string[] {
  const component = findPmlComponent(findNodeById(page, "instructions-section"));
  return (component ? childrenOf(component) : []).flatMap((step) => {
    const text = childrenOf(step).filter((c) => c.type === "RICH_TEXT" && typeof c.markdown === "string")[1];
    return text ? [stripColorTags(text.markdown as string)] : [];
  });
}

function extractStepsPortions(page: unknown): number | null {
  const text = collectMarkdowns(findNodeById(page, "instructions-portions-section"))[0];
  const portions = text?.match(/\d+/)?.[0];
  return portions ? Number(portions) : null;
}

function extractRecipeNutritionRows(page: unknown): NutritionRow[] {
  const item = accordionItems(findNodeById(page, "accordion-list")).find((i) => /voedingswaarde|nährwert|valeurs nutritionnelles/i.test(collectMarkdowns(i.header)[0] ?? ""));
  return item ? collectNutritionRows(item.body) : [];
}

/** Product-page fallback for ingredients without a visible tile, such as pantry staples. */
export function extractIngredientProductName(page: FusionPage): string | null {
  return textByType(page, "HEADER1");
}

/**
 * Extracts structured details of a catalog or user-defined recipe from its
 * `selling-group-details-page` response.
 *
 * The page embeds the recipe as an analytics `recipe` context (name, displayed
 * portions, image type and the full `selling_units` list), a header object with
 * `creator_type` / `default_portions` / `is_saved`, an `is_recipe_owner` flag
 * and, when present, the note as the `initialContent` of a `TEXT_EDITOR` component.
 *
 * Names, product ids and quantities all come from this response at `portions`.
 * The stored default is exposed separately as `defaultPortions`; changing the
 * portion count may select different products, not merely scale quantities.
 * @param {string} recipeId The recipe id that was requested.
 * @param {FusionPage} page The raw page response.
 */
export function extractRecipeDetails(recipeId: string, page: FusionPage): RecipeDetails {
  let recipeContext: Record<string, any> | undefined;
  let header: Record<string, any> | undefined;
  let owner: Record<string, any> | undefined;
  let note: string | null = null;
  let imageId: string | null = null;

  walkObjects(page, (obj) => {
    if (obj.id === "selling-group-details-image") {
      walkObjects(obj, (image) => {
        if (!imageId && image.type === "IMAGE" && typeof image.source?.id === "string") imageId = image.source.id;
      });
    }
    if (!recipeContext && obj.recipe_id === recipeId && Array.isArray(obj.selling_units) && typeof obj.recipe_name === "string") {
      recipeContext = obj;
    }
    if (!header && typeof obj.creator_type === "string" && typeof obj.sellable_name === "string") {
      header = obj;
    }
    if (!owner && typeof obj.is_recipe_owner === "boolean" && typeof obj.name === "string") {
      owner = obj;
    }
    if (note === null && obj.type === "TEXT_EDITOR" && typeof obj.initialContent === "string") {
      note = obj.initialContent;
    }
  });

  if (!recipeContext) throw new Error(`Could not extract recipe ${recipeId}: recipe context missing from details page`);
  const tiles = extractIngredientTiles(page);
  const states = extractIngredientStates(page);
  const allergens = extractAllergensByIngredient(page);
  const ingredients: RecipeIngredient[] = recipeContext.selling_units.map((unit: Record<string, any>) => {
    const sellingUnitId: string = unit.selling_unit_id ?? "";
    const tile = tiles.get(unit.ingredient_id);
    // Package size and image belong to the product on the tile; an ingredient can list more products.
    const showsThisUnit = tile?.sellingUnitId === null || tile?.sellingUnitId === sellingUnitId;
    const state = states.get(unit.ingredient_id);
    const prices = state?.sellingUnits?.[sellingUnitId];
    const price = typeof prices?.price === "number" ? prices.price : null;
    const referencePrice = typeof prices?.referencePrice === "number" ? prices.referencePrice : null;
    const isAvailable = state?.isAvailable ?? unit.status === "ACTIVE";
    return {
      ingredientId: unit.ingredient_id,
      name: tile?.name ?? null,
      sellingUnitId,
      quantity: unit.quantity ?? 1,
      status: unit.status ?? "ACTIVE",
      swapType: unit.swap_type ?? null,
      checked: unit.checked ?? true,
      type: state?.ingredientType ?? "CORE",
      isAvailable,
      unavailableReason: isAvailable ? null : (tile?.notice ?? null),
      brand: tile?.brand ?? null,
      imageId: showsThisUnit ? (tile?.imageId ?? null) : null,
      unitQuantity: showsThisUnit ? (tile?.unitQuantity ?? null) : null,
      neededText: tile?.neededText ?? null,
      price,
      originalPrice: price !== null && referencePrice !== null && referencePrice > price ? referencePrice : null,
      priceRanges: Array.isArray(prices?.priceRanges) && prices.priceRanges.length > 1 ? prices.priceRanges : null,
      promotionLabel: tile?.promotionLabel ?? null,
      allergens: allergens.get(unit.ingredient_id) ?? { contains: [], mayContain: [] },
    };
  });
  const selectedIngredientIds = extractDefaultSelectedIngredientIds(page) ?? new Set(ingredients.filter((i) => i.checked).map((i) => i.ingredientId));
  const times = extractTimes(page);

  return {
    id: recipeId,
    name: recipeContext?.recipe_name ?? header?.sellable_name ?? owner?.name ?? "",
    portions: recipeContext.portions ?? header?.default_portions ?? 0,
    defaultPortions: header?.default_portions ?? recipeContext.portions ?? 0,
    displayedPortions: recipeContext?.portions ?? header?.default_portions ?? 0,
    creatorType: header?.creator_type ?? "UNKNOWN",
    isRecipeOwner: owner?.is_recipe_owner ?? false,
    isSaved: header?.is_saved ?? false,
    imageType: recipeContext?.image_type ?? null,
    imageId,
    ingredients,
    note,
    ...extractHeading(page),
    times,
    cookingTimeMinutes: times.length > 0 ? parseMinutes(times[0].value) : null,
    steps: extractSteps(page),
    stepsPortions: extractStepsPortions(page),
    stepsWarning: markdownText(findNode(findNodeById(page, "warning-banner"), (n) => n.type === "RICH_TEXT" && typeof n.markdown === "string") ?? undefined),
    nutritionRows: extractRecipeNutritionRows(page),
    allergens: combineAllergens([...allergens].filter(([id]) => selectedIngredientIds.has(id)).map(([, a]) => a)),
  };
}

/** Compatibility name for the shared extractor; quantities match portions. */
export const extractUserDefinedRecipeDetails = extractRecipeDetails;

/**
 * Extracts the required amount per selling unit for every ingredient from a
 * `selling-group-content-wrapper` (or `selling-group-details-page`) response.
 * The quantities are scaled to the `portions` the page was requested with.
 * @param {unknown} page The raw page response.
 * @returns Ingredient id → (selling unit id → required amount).
 */
export function extractIngredientQuantities(page: unknown): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  walkObjects(page, (obj) => {
    if (obj.type !== "STATE_BOUNDARY" || obj.id !== "sellableContentState") return;
    for (const ingredient of obj.state?.ingredientsState ?? []) {
      if (!ingredient?.ingredientId || !ingredient.sellingUnits) continue;
      result[ingredient.ingredientId] = Object.fromEntries(
        Object.values(ingredient.sellingUnits as Record<string, any>).map((unit) => [unit.sellingUnitId, unit.requiredAmount ?? 0]),
      );
    }
  });
  return result;
}

/**
 * Extracts the suggested images from a `sellable-image-selection-page-root`
 * response. The page keeps them in the `ImageSelectionState` state boundary as
 * `referenceImagesById`; each entry is what the save button sends as
 * `reference_image`, with its id as `selected_image_id`.
 * @param {unknown} page The raw page response.
 */
export function extractSuggestedImages(page: unknown): UserDefinedRecipeSuggestedImage[] {
  const images: UserDefinedRecipeSuggestedImage[] = [];
  walkObjects(page, (obj) => {
    if (obj.type !== "STATE_BOUNDARY" || obj.id !== "ImageSelectionState") return;
    for (const reference of Object.values(obj.state?.referenceImagesById ?? {}) as UserDefinedRecipeReferenceImage[]) {
      if (reference?.id) images.push({ id: reference.id, referenceImage: reference });
    }
  });
  return images;
}
