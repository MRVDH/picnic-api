"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserDefinedRecipeDetails = void 0;
exports.extractRecipes = extractRecipes;
exports.extractUserDefinedRecipes = extractUserDefinedRecipes;
exports.extractIngredientProductName = extractIngredientProductName;
exports.extractRecipeDetails = extractRecipeDetails;
exports.extractIngredientQuantities = extractIngredientQuantities;
exports.extractSuggestedImages = extractSuggestedImages;
const RECIPE_SCHEMA = "iglu:tech.picnic.snowplow.analytics/recipe/jsonschema/";
const SEGMENT_SCHEMA = "iglu:tech.picnic.snowplow.analytics/segment/jsonschema/";
/** Recursively visit every object in a JSON tree. */
const walkObjects = (node, visit) => {
    if (Array.isArray(node)) {
        node.forEach((child) => walkObjects(child, visit));
    }
    else if (node && typeof node === "object") {
        visit(node);
        Object.values(node).forEach((child) => walkObjects(child, visit));
    }
};
const plainText = (markdown) => markdown.replace(/#\([^)]*\)/g, "").replace(/\*\*/g, "").replace(/\u00a0/g, " ").trim();
const textByType = (node, textType) => {
    let result = null;
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
function extractRecipes(page, segmentType) {
    const byId = new Map();
    walkObjects(page, (obj) => {
        const contexts = obj.analytics?.contexts ?? obj.contexts;
        if (!Array.isArray(contexts))
            return;
        const segment = contexts.find((c) => c.schema?.startsWith(SEGMENT_SCHEMA));
        if (segment?.data?.segment_type !== segmentType)
            return;
        const recipe = contexts.find((c) => c.schema?.startsWith(RECIPE_SCHEMA))?.data;
        if (typeof recipe?.recipe_id !== "string")
            return;
        const previous = byId.get(recipe.recipe_id);
        byId.set(recipe.recipe_id, {
            id: recipe.recipe_id,
            name: previous?.name || recipe.recipe_name || textByType(obj.pml, "SUBTITLE1") || "",
            imageType: previous?.imageType ?? recipe.recipe_image_type ?? recipe.image_type ?? null,
        });
    });
    return [...byId.values()];
}
/** Compatibility helper for the user's own cookbook segment. */
function extractUserDefinedRecipes(page) {
    return extractRecipes(page, "USER_DEFINED_RECIPES");
}
/** Ingredient names keyed by component id, including discontinued products. */
function extractIngredientNames(page) {
    const names = new Map();
    walkObjects(page, (obj) => {
        if (obj.type !== "PML" || typeof obj.id !== "string" || !obj.id.includes("selling-unit-tile"))
            return;
        const contexts = obj.analytics?.contexts ?? [];
        const recipe = contexts.find((c) => c.schema?.startsWith(RECIPE_SCHEMA))?.data;
        const units = recipe?.selling_units;
        // Discontinued tiles omit analytics. Their edit link still carries the
        // component id; read the URL as text without executing its JavaScript.
        const ingredientId = Array.isArray(units) && units.length === 1
            ? units[0].ingredient_id
            : JSON.stringify(obj.pml ?? {}).match(/ingredient_id=([a-f0-9-]+)&/)?.[1];
        const name = textByType(obj.pml, "SUBTITLE1");
        if (typeof ingredientId === "string" && name)
            names.set(ingredientId, name);
    });
    return names;
}
/** Product-page fallback for ingredients without a visible tile, such as pantry staples. */
function extractIngredientProductName(page) {
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
function extractRecipeDetails(recipeId, page) {
    let recipeContext;
    let header;
    let owner;
    let note = null;
    let imageId = null;
    walkObjects(page, (obj) => {
        if (obj.id === "selling-group-details-image") {
            walkObjects(obj, (image) => {
                if (!imageId && image.type === "IMAGE" && typeof image.source?.id === "string")
                    imageId = image.source.id;
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
    if (!recipeContext)
        throw new Error(`Could not extract recipe ${recipeId}: recipe context missing from details page`);
    const names = extractIngredientNames(page);
    const ingredients = recipeContext.selling_units.map((unit) => ({
        ingredientId: unit.ingredient_id,
        name: names.get(unit.ingredient_id) ?? null,
        sellingUnitId: unit.selling_unit_id ?? "",
        quantity: unit.quantity ?? 1,
        status: unit.status ?? "ACTIVE",
        swapType: unit.swap_type ?? null,
        checked: unit.checked ?? true,
    }));
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
    };
}
/** Compatibility name for the shared extractor; quantities match portions. */
exports.extractUserDefinedRecipeDetails = extractRecipeDetails;
/**
 * Extracts the required amount per selling unit for every ingredient from a
 * `selling-group-content-wrapper` (or `selling-group-details-page`) response.
 * The quantities are scaled to the `portions` the page was requested with.
 * @param {unknown} page The raw page response.
 * @returns Ingredient id → (selling unit id → required amount).
 */
function extractIngredientQuantities(page) {
    const result = {};
    walkObjects(page, (obj) => {
        if (obj.type !== "STATE_BOUNDARY" || obj.id !== "sellableContentState")
            return;
        for (const ingredient of obj.state?.ingredientsState ?? []) {
            if (!ingredient?.ingredientId || !ingredient.sellingUnits)
                continue;
            result[ingredient.ingredientId] = Object.fromEntries(Object.values(ingredient.sellingUnits).map((unit) => [unit.sellingUnitId, unit.requiredAmount ?? 0]));
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
function extractSuggestedImages(page) {
    const images = [];
    walkObjects(page, (obj) => {
        if (obj.type !== "STATE_BOUNDARY" || obj.id !== "ImageSelectionState")
            return;
        for (const reference of Object.values(obj.state?.referenceImagesById ?? {})) {
            if (reference?.id)
                images.push({ id: reference.id, referenceImage: reference });
        }
    });
    return images;
}
//# sourceMappingURL=helpers.js.map