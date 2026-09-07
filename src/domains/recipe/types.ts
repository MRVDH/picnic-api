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

/** Response of `assign-selling-group-to-basket`. */
export type AssignSellingGroupToBasketResult = {
  anyUnavailableIngredient: boolean;
  assignedNumberOfPortions: number;
  cart: SellingGroupCartSnapshot;
};

/** Response of `remove-selling-group-from-basket`. */
export type RemoveSellingGroupFromBasketResult = {
  cart: SellingGroupCartSnapshot;
  /** The ingredient (selling group component) ids that were in the basket. */
  selectedSellableComponentIds: string[];
  /** The selling units removed from the basket. */
  SURemoved: { quantity: number; selling_unit_id: string }[];
};

// ─── Shared recipe response types ────────────────────────────────────────────

/** Cookbook segments exposed by the structured recipe list methods. */
export type RecipeSegment = "SAVED_RECIPES" | "USER_DEFINED_RECIPES";

/** Image sources observed on recipe pages; open to additional backend values. */
export type RecipeImageType = "COMPOSED" | "CUSTOM" | "SUGGESTED" | "GALLERY" | string;

/** A catalog or user-defined recipe as listed in the cookbook. */
export type RecipeSummary = {
  /** The recipe's selling group id. */
  id: string;
  name: string;
  /**
   * Image type from tile analytics, or null when absent. Tiles can report GALLERY
   * when details report COMPOSED, so prefer RecipeDetails.imageType when available.
   */
  imageType: RecipeImageType | null;
};

/** One ingredient (a selling group component) of either kind of recipe. */
export type RecipeIngredient = {
  ingredientId: string;
  /** Readable product name, or null when neither recipe nor product page supplies it. */
  name: string | null;
  /** Product id, e.g. s1143210; empty for some discontinued products. */
  sellingUnitId: string;
  /** Selling-unit count for RecipeDetails.portions, not a weight or volume. */
  quantity: number;
  /** Backend status; discontinued products can still report ACTIVE. */
  status: "ACTIVE" | "UNAVAILABLE" | string;
  swapType: SellingGroupSwapType | null;
  /** Whether selected by default when adding the recipe to the basket. */
  checked: boolean;
};

/** Shared structured details for catalog and user-defined recipes. */
export type RecipeDetails = RecipeSummary & {
  /** Portion count for the returned products and quantities. */
  portions: number;
  /** Stored default portion count, which can differ from a requested count. */
  defaultPortions: number;
  /** Portion count of the returned page; the same as portions. */
  displayedPortions: number;
  creatorType: "USER" | "PIM" | string;
  isRecipeOwner: boolean;
  isSaved: boolean;
  /** Main image source id including its namespace (e.g. recipes/abc); null if absent or hidden. */
  imageId: string | null;
  ingredients: RecipeIngredient[];
  /** Free-text note as HTML, or null; not the catalog recipe's cooking steps. */
  note: string | null;
};

/** Optional extra requests when retrieving structured recipe details. */
export type RecipeDetailsOptions = {
  /**
   * Fetch product pages for names missing from recipe tiles. Defaults to false.
   * Requests run concurrently, once per distinct product; request failures reject
   * the detail call. A missing name on a successful page remains null.
   */
  resolveIngredientNames?: boolean;
};

// ─── User Defined Recipe (custom recipe) types ───────────────────────────────
//
// Custom recipes are called "user defined recipes" (UDR) / "user defined
// sellables" by the Picnic backend. They are selling groups with
// `creator_type: "USER"` and a 32-hex-character id. All mutations go through
// `POST /pages/task/<task-id>` with a `{ payload }` body; the task ids and
// payload shapes below were extracted from the PML expressions served by the
// pages `user-defined-recipe-root`, `create-recipe-name-page-root`,
// `selling-group-details-page`, `selling-group-component-edit-page`,
// `sellable-bottom-sheet-edit-portions`, `selling-group-note-page-root`,
// `sellable-image-selection-page-root`, `delete-user-defined-recipe-confirmation-dialog`
// and `search-page-root-content?page_context=RECIPE_EDITING`.

/** Where an ingredient was picked from while composing a new recipe (analytics only). */
export type UserDefinedRecipeIngredientSource = "search" | "usuals-suggestion" | string;

/**
 * How the product of an ingredient was chosen when it was swapped. The app derives
 * it on `selling-group-component-edit-page`: staying within the ingredient's own
 * products is `WITHIN_SELLING_GROUP_COMPONENT`, one of the suggestions below it is
 * `POPULAR_SELECTION`, anything else came from search.
 */
export type SellingGroupSwapType = "WITHIN_SELLING_GROUP_COMPONENT" | "POPULAR_SELECTION" | "SEARCH_SELECTION";

/** Compatibility name for the shared recipe image type. */
export type UserDefinedRecipeImageType = RecipeImageType;

/** Compatibility name for the shared recipe summary. */
export type UserDefinedRecipeSummary = RecipeSummary;
/** Compatibility name for the shared recipe ingredient. */
export type UserDefinedRecipeIngredient = RecipeIngredient;
/** Compatibility name for the shared recipe details. */
export type UserDefinedRecipeDetails = RecipeDetails;

/** Payload for `POST /pages/task/create-user-defined-recipe`. */
export type CreateUserDefinedRecipePayload = {
  /** Client-side id; the app sends `undefined` and lets the backend generate one. */
  id?: string;
  name: string;
  portions: number;
  /** Selling unit id → quantity. */
  selling_unit_quantities_by_id: Record<string, number>;
  /** Selling unit id → where it was picked from (analytics only). */
  selling_unit_sources: Record<string, UserDefinedRecipeIngredientSource>;
  /** Ordered list of selling unit ids. */
  selling_units: string[];
};

export type CreateUserDefinedRecipeInput = {
  payload: CreateUserDefinedRecipePayload;
};

/** Response of `create-user-defined-recipe`. */
export type CreateUserDefinedRecipeResult = {
  /** The id of the newly created recipe. */
  sellingGroupId: string;
  /** Present when the recipe was also added to the basket during creation. */
  modifyResponse?: unknown;
  SUAnalytics?: unknown;
};

/** An ingredient to include when creating a user defined recipe. */
export type NewUserDefinedRecipeIngredient = {
  /** The product (selling unit) id, e.g. `s1143210`. */
  sellingUnitId: string;
  /** Number of selling units; defaults to 1. */
  quantity?: number;
  /** Analytics-only origin of the pick; defaults to `search`. */
  source?: UserDefinedRecipeIngredientSource;
};

/**
 * Payload for `POST /pages/task/update-name-user-defined-recipe`.
 * Extracted from `create-recipe-name-page-root?origin=RECIPE_DETAILS&sellable_id=<id>`.
 */
export type UpdateUserDefinedRecipeNamePayload = {
  name: string;
  selling_group_id: string;
};

export type UpdateUserDefinedRecipeNameInput = {
  payload: UpdateUserDefinedRecipeNamePayload;
};

/**
 * Payload for `POST /pages/task/update-portions-user-defined-recipe`.
 * Extracted from `sellable-bottom-sheet-edit-portions?sellable_creator_type=USER&sellable_id=<id>`.
 */
export type UpdateUserDefinedRecipePortionsPayload = {
  portions: number;
  sellable_id: string;
};

export type UpdateUserDefinedRecipePortionsInput = {
  payload: UpdateUserDefinedRecipePortionsPayload;
};

/**
 * Payload for `POST /pages/task/delete-user-defined-sellable`.
 * Extracted from `delete-user-defined-recipe-confirmation-dialog?sellable_id=<id>`.
 */
export type DeleteUserDefinedRecipePayload = {
  sellable_id: string;
};

export type DeleteUserDefinedRecipeInput = {
  payload: DeleteUserDefinedRecipePayload;
};

/**
 * Payload for `POST /pages/task/add-ingredient-task`.
 * Extracted from the product tiles on `search-page-root-content?page_context=RECIPE_EDITING`.
 * Numbers are sent as strings, exactly like the app does.
 */
export type AddUserDefinedRecipeIngredientPayload = {
  /** Position of the new ingredient in the list (the app sends the current ingredient count). */
  order: string;
  quantity: number;
  /** The recipe's number of portions the quantity is based on. */
  requested_portions: string;
  selling_group_id: string;
  selling_unit_id: string;
};

export type AddUserDefinedRecipeIngredientInput = {
  payload: AddUserDefinedRecipeIngredientPayload;
};

/** Response of `add-ingredient-task`. */
export type AddUserDefinedRecipeIngredientResult = {
  /** The id of the created ingredient (selling group component). */
  newComponentId: string;
};

/**
 * Payload for `POST /pages/task/save-selling-group-edit-task`.
 * Extracted from `selling-group-component-edit-page?is_udr=true&...`.
 */
export type UpdateUserDefinedRecipeIngredientPayload = {
  requested_sellable_portions: string;
  selling_group_component_id: string;
  selling_group_id: string;
  /** Selling unit id → quantity. Use a different selling unit id to swap the product. */
  selling_unit_quantity_by_id: Record<string, number>;
  swapType?: SellingGroupSwapType | null;
};

export type UpdateUserDefinedRecipeIngredientInput = {
  payload: UpdateUserDefinedRecipeIngredientPayload;
};

/** A basket line's link to the recipe it was added for. */
export type SellingGroupCartLineContext = {
  quantity: number;
  details: (
    | {
        type: "SELLING_GROUP";
        sellingGroupId: string;
        sellingGroupComponentId: string;
        sellingGroupComponentType: string;
        sellingGroupComponentSwapType: SellingGroupSwapType | null;
      }
    | { type: "MEAL_PLAN"; dayRelativeToSlot: number; numberOfServings: number }
    | { type: string; [key: string]: unknown }
  )[];
};

/** Basket snapshot returned by the recipe basket tasks. */
export type SellingGroupCartSnapshot = {
  checkoutTotalPrice: number | null;
  generatedAt: number;
  /** Selling unit id → quantity, availability and, for recipe lines, the recipe contexts. */
  sellingUnits: Record<
    string,
    {
      availabilityStatus: { type: string };
      quantity: number;
      contexts?: SellingGroupCartLineContext[];
    }
  >;
  sellingUnitsTotalPrice: number;
};

/** Response of `save-selling-group-edit-task`. */
export type UpdateUserDefinedRecipeIngredientResult = {
  cart?: SellingGroupCartSnapshot;
  /**
   * `true` when the recipe is in the basket and the basket still holds the old
   * selection. The app then posts `assign-sellable-component-to-day`; see
   * {@link AssignSellableComponentToDayPayload}.
   */
  shouldUpdateCart?: boolean;
};

/**
 * Payload for `POST /pages/task/assign-sellable-component-to-day`.
 * Extracted from the save button of `selling-group-component-edit-page`. The app
 * sends it after `save-selling-group-edit-task` answered `shouldUpdateCart: true`,
 * so the basket picks up the new ingredient selection.
 */
export type AssignSellableComponentToDayPayload = {
  component_swap_type: SellingGroupSwapType;
  /** The recipe's number of portions, sent as a string like the app does. */
  portions: string;
  /** Selling unit id → quantity for this ingredient. */
  required_amount_by_selling_unit_id: Record<string, number>;
  /** The ingredient (selling group component) id. */
  selected_component_id: string;
  selling_group_id: string;
};

export type AssignSellableComponentToDayInput = {
  payload: AssignSellableComponentToDayPayload;
};

/** Response of `assign-sellable-component-to-day`. */
export type AssignSellableComponentToDayResult = {
  cart?: SellingGroupCartSnapshot;
};

/**
 * Payload for `POST /pages/task/delete-selling-group-component`.
 * Extracted from `selling-group-component-edit-page?is_udr=true&...`.
 */
export type RemoveUserDefinedRecipeIngredientPayload = {
  selling_group_component_id: string;
  selling_group_id: string;
};

export type RemoveUserDefinedRecipeIngredientInput = {
  payload: RemoveUserDefinedRecipeIngredientPayload;
};

/** Response of `delete-selling-group-component`. */
export type RemoveUserDefinedRecipeIngredientResult = {
  cart?: SellingGroupCartSnapshot;
};

/**
 * Payload for `POST /pages/task/update-selling-group-note`.
 * Extracted from `selling-group-note-page-root?selling_group_id=<id>`.
 * The note is HTML (`<p>…</p>`) and may be at most 5000 characters of text.
 */
export type UpdateUserDefinedRecipeNotePayload = {
  note: string;
  selling_group_id: string;
};

export type UpdateUserDefinedRecipeNoteInput = {
  payload: UpdateUserDefinedRecipeNotePayload;
};

/** Payload for `POST /pages/task/delete-selling-group-note-task`. */
export type DeleteUserDefinedRecipeNotePayload = {
  selling_group_id: string;
};

export type DeleteUserDefinedRecipeNoteInput = {
  payload: DeleteUserDefinedRecipeNotePayload;
};

/**
 * Metadata of a suggested image on `sellable-image-selection-page-root`, taken from
 * the page's `ImageSelectionState.referenceImagesById`.
 */
export type UserDefinedRecipeReferenceImage = {
  id: string;
  /** Image namespace, e.g. `recipes`. */
  namespace: string;
  primary_image: boolean;
  rank_value: number;
  /** The Picnic recipe the image belongs to. */
  sellable_id: string;
  type: string;
};

/** A suggested image the user can pick with `selectUserDefinedRecipeImage`. */
export type UserDefinedRecipeSuggestedImage = {
  /** The image id, which is also the `selected_image_id` to send. */
  id: string;
  /** The metadata to send along as `reference_image`. */
  referenceImage: UserDefinedRecipeReferenceImage;
};

/**
 * Payload for `POST /pages/task/select-sellable-image`.
 * Extracted from `sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=<id>`.
 */
export type SelectUserDefinedRecipeImagePayload = {
  sellable_id: string;
  /** The id of a suggested image or of a customer-uploaded image. */
  selected_image_id?: string;
  /** Reference image metadata for suggested images, as provided by the image selection page. */
  reference_image?: UserDefinedRecipeReferenceImage;
};

export type SelectUserDefinedRecipeImageInput = {
  payload: SelectUserDefinedRecipeImagePayload;
};

/** An image file to upload for a user defined recipe. */
export type UserDefinedRecipeImageUpload = {
  /** Raw image bytes. */
  data: Blob | ArrayBuffer | Uint8Array;
  /** MIME type, e.g. `image/jpeg`. The app normalises `jpg` to `jpeg`. */
  type?: string;
};

/** Response of `POST /user-defined-sellable/{sellableId}` (raw image body upload). */
export type UserDefinedRecipeImageUploadResult = {
  image_id?: string;
  imageId?: string;
  namespace?: string;
  [key: string]: unknown;
};
