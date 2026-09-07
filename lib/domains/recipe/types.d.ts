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
/** Where an ingredient was picked from while composing a new recipe (analytics only). */
export type UserDefinedRecipeIngredientSource = "search" | "usuals-suggestion" | string;
/** A summary of one of the user's own recipes, as listed in the cookbook "Eigen recepten" segment. */
export type UserDefinedRecipeSummary = {
    /** The recipe id (a `selling_group_id`, 32 hex chars). */
    id: string;
    name: string;
    /** `GALLERY` for a customer-uploaded photo, `SUGGESTED` for a Picnic-composed image. */
    imageType: "GALLERY" | "SUGGESTED" | string | null;
};
/** One ingredient (a "selling group component") of a user defined recipe. */
export type UserDefinedRecipeIngredient = {
    /** The ingredient / selling group component id (32 hex chars). */
    ingredientId: string;
    /** The product (selling unit) id, e.g. `s1143210`. */
    sellingUnitId: string;
    /** Number of selling units needed for the recipe's default `portions`. */
    quantity: number;
    status: "ACTIVE" | "UNAVAILABLE" | string;
    swapType: string | null;
    /** Whether the ingredient is selected by default when adding the recipe to the basket. */
    checked: boolean;
};
/** Structured details of a user defined recipe, extracted from `selling-group-details-page`. */
export type UserDefinedRecipeDetails = {
    id: string;
    name: string;
    /** The stored default number of portions; ingredient quantities are for this count. */
    portions: number;
    /**
     * The portion count the details page rendered the recipe at. The page uses a
     * multiple of `portions` (e.g. 4 for a 2-portion recipe); raw page data is scaled to it.
     */
    displayedPortions: number;
    creatorType: "USER" | "PIM" | string;
    isRecipeOwner: boolean;
    isSaved: boolean;
    imageType: "GALLERY" | "SUGGESTED" | string | null;
    ingredients: UserDefinedRecipeIngredient[];
    /** The free-text note (ingredients/instructions) as HTML, or `null` when no note exists. */
    note: string | null;
};
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
    swapType?: string | null;
};
export type UpdateUserDefinedRecipeIngredientInput = {
    payload: UpdateUserDefinedRecipeIngredientPayload;
};
/** Response of `save-selling-group-edit-task`. */
export type UpdateUserDefinedRecipeIngredientResult = {
    shouldUpdateCart?: boolean;
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
 * Payload for `POST /pages/task/select-sellable-image`.
 * Extracted from `sellable-image-selection-page-root?origin=RECIPE_DETAILS&sellable_id=<id>`.
 */
export type SelectUserDefinedRecipeImagePayload = {
    sellable_id: string;
    /** The id of a suggested image or of a customer-uploaded image. */
    selected_image_id?: string;
    /** Reference image metadata for suggested images, as provided by the image selection page. */
    reference_image?: unknown;
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
    filename?: string;
};
/** Response of `POST /user-defined-sellable/{sellableId}` (raw image body upload). */
export type UserDefinedRecipeImageUploadResult = {
    image_id?: string;
    imageId?: string;
    namespace?: string;
    [key: string]: unknown;
};
//# sourceMappingURL=types.d.ts.map