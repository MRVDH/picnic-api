// ─── Recipe Saving types ─────────────────────────────────────────────────────

/**
 * Payload describing which recipe to save or unsave.
 *
 * When `saved_at` is an ISO-8601 timestamp string the recipe is **saved**.
 * When `saved_at` is `null` the recipe is **unsaved**.
 */
export type RecipeSavingPayload = {
  recipe_id: string;
  saved_at: string | null;
};

/**
 * Request body sent to `POST /pages/task/recipe-saving`.
 */
export type RecipeSavingInput = {
  payload: RecipeSavingPayload;
};

// ─── Selling Group (Meal Planner) types ──────────────────────────────────────

/**
 * Payload for assigning a selling group (recipe bundle) to the basket.
 * Extracted from the `onAddButtonPostRecipeHandler` PML expression in `cookbook-page-content`.
 */
export type AssignSellingGroupPayload = {
  selling_group_id: string;
  day_offset?: number;
  portions?: number;
};

export type AssignSellingGroupInput = {
  payload: AssignSellingGroupPayload;
};

/**
 * Payload for updating the number of portions of a selling group already in the basket.
 * Extracted from the portion-update PML expression in `cookbook-page-content`.
 */
export type UpdateSellingGroupPortionsPayload = {
  selling_group_id: string;
  day_offset: number;
  portions: number;
};

export type UpdateSellingGroupPortionsInput = {
  payload: UpdateSellingGroupPortionsPayload;
};

/**
 * Payload for removing a selling group from the basket.
 * Extracted from the "REMOVE" case PML expression in `cookbook-page-content`.
 */
export type RemoveSellingGroupPayload = {
  selling_group_id: string;
};

export type RemoveSellingGroupInput = {
  payload: RemoveSellingGroupPayload;
};
