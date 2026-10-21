import { Component, Icon, PriceRange } from "../../types/fusion";
import { Decorator } from "../../types/common";

// ─── Delivery Slots ───────────────────────────────────────────────────────────

export type DeliverySlot = {
  slot_id: string;
  hub_id: string;
  fc_id: string;
  window_start: string;
  window_end: string;
  cut_off_time: string;
  is_available: boolean;
  selected: boolean;
  reserved: boolean;
  /** Only present for future/selectable slots; absent on historical delivery slots. */
  minimum_order_value?: number;
  /** Only present when the slot is unavailable. */
  unavailability_reason?: "CLOSED" | string;
  /** Rich icon; only present when provided by the API. */
  icon?: Icon;
  /** Slot characteristics such as PREFERRED; may be an empty array. */
  slot_characteristics: string[];
};

export type SelectedSlot = {
  slot_id: string;
  /** E.g. "IMPLICIT" | "ACTIVE" | "EXPLICIT" */
  state: string;
};

export type SlotSelectorMessage = {
  pml_version: string;
  component: Component;
  images: { icon: string };
  tracking_attributes: { template_variant_id: string; entity_ids: string[] };
};

// ─── Order Lines ──────────────────────────────────────────────────────────────

export type OrderArticle = {
  type: "ORDER_ARTICLE";
  id: string;
  name: string;
  unit_quantity: string;
  unit_quantity_sub?: string;
  /** Base per-unit price in cents (before bundle discounts). */
  price: number;
  /** Bundle discount price tiers. Present when picnic headers are sent; each entry defines a per-unit price that applies when the cart quantity reaches `from_quantity`. */
  price_ranges?: PriceRange[];
  decorators: Decorator[];
  max_count: number;
  image_ids: string[];
  perishable: boolean;
  /** Analytics context entries for mutation tracking; usually an empty array. */
  analytics_contexts: any[];
  /** Selling unit context metadata; usually an empty array. */
  selling_unit_contexts_for_mutations: any[];
};

export type OrderLine = {
  type: "ORDER_LINE";
  id: string;
  items: OrderArticle[];
  display_price: number;
  price: number;
  /** Decorators such as PRICE (discounted total) and PROMO (e.g. "BundelBonus"). Present when picnic headers are sent or on delivery order lines. */
  decorators?: Decorator[];
};

// ─── Order / Cart ─────────────────────────────────────────────────────────────

export type DepositBreakdown = {
  type: "BAG" | "DEFAULT" | string;
  value: number;
  count: number;
};

export type TransactionInfo = {
  /** BIC/SWIFT code of the bank. */
  bank_id: string;
  /** E.g. "DIRECT_DEBIT" | "IDEAL" | string */
  payment_type: string;
  /** Masked IBAN, e.g. "•••• 2173". */
  redacted_iban: string;
  refund_account: boolean;
};

export type DeliveryStatus = "CURRENT" | "COMPLETED" | "CANCELLED" | string;

/** Analytics item entry inside Cart.analytics_context_data. */
export type CartAnalyticsItem = {
  product_id: string;
  quantity: number;
  is_available: boolean;
  is_in_recipe: boolean;
};

/**
 * The active shopping cart returned by GET /cart.
 * This is distinct from a placed Order that lives inside a Delivery.
 */
export type Cart = {
  type: "ORDER";
  id: string;
  items: OrderLine[];
  delivery_slots: DeliverySlot[];
  selected_slot: SelectedSlot;
  /** Null when no slot-selector message is configured. */
  slot_selector_message: SlotSelectorMessage | null;
  total_count: number;
  total_price: number;
  checkout_total_price: number;
  /** Total savings from bundle discounts in cents. Present when picnic headers are sent. */
  total_savings?: number;
  /** Modification timestamp (milliseconds). */
  mts: number;
  deposit_breakdown: DepositBreakdown[];
  decorator_overrides: { [key: string]: Decorator[] };
  /** Signed JWT that represents the current cart state; used for checkout. */
  state_token: string;
  /** Applied fees (e.g. service fees); usually an empty array. */
  fees: any[];
  /** Basket sections for grouped display; usually an empty array. */
  basket_sections: any[];
  analytics_context_data: { items_list: CartAnalyticsItem[] };
  show_create_sellable_banner: boolean;
  /** Savings from a membership/subscription (in cents). */
  membership_savings: number;
};

/**
 * A placed order that is part of a Delivery (not the active shopping cart).
 */
export type Order = {
  type: "ORDER";
  id: string;
  items: OrderLine[];
  total_price: number;
  checkout_total_price: number;
  total_savings: number;
  total_deposit: number;
  cancellable: boolean;
  creation_time: string;
  status: DeliveryStatus;
  decorator_overrides: { [key: string]: Decorator[] };
  cancellation_time: string | null;
  /** Payment details; present for placed orders, absent for the active cart. */
  transaction_info?: TransactionInfo;
  /** Always null for placed orders; may be absent or null. */
  slot_selector_message?: SlotSelectorMessage | null;
  deposit_breakdown?: DepositBreakdown[];
  fees?: any[];
  basket_sections?: any[];
  analytics_context_data?: Record<string, any>;
  membership_savings?: number;
};

// ─── Selling Unit Contexts ────────────────────────────────────────────────────

export type MealPlanContext = {
  type: "MEAL_PLAN";
  day_offset: number;
  servings: number;
};

export type SellingGroupContext = {
  type: "SELLING_GROUP";
  recipe_id: string;
  ingredient_id: string;
  component_type: string;
};

export type RecipeContext = {
  type: "RECIPE" | "RECIPES";
  recipe_id: string;
  section_id?: string;
  recipe_section_id?: string;
  recipe_ingredient_type?: string;
};

export type SellingUnitContext = MealPlanContext | SellingGroupContext | RecipeContext;

// ─── Cart Actions ─────────────────────────────────────────────────────────────

export type AddProductInput = {
  product_id: string;
  count: number;
  selling_unit_contexts?: SellingUnitContext[];
};

export type AddProductsItem = {
  productId: string;
  quantity: number;
};

export type GetDeliverySlotsResult = {
  delivery_slots: DeliverySlot[];
  slot_selector_message: SlotSelectorMessage;
  selected_slot: SelectedSlot;
};

/** A delivery slot as returned by `cart.getDeliverySlotOverview`. */
export type DeliverySlotSummary = {
  slotId: string;
  windowStart: string;
  windowEnd: string;
  cutOffTime: string;
  isAvailable: boolean;
  isSelected: boolean;
  /**
   * True for the longer slot when two slots start at the same time (e.g. 120 instead of 60 minutes), which Picnic
   * offers as the green choice. The API has no field for this, so it is derived from the windows.
   */
  isGreenChoice: boolean;
  /** Null when the API sends no minimum order value for the slot. */
  minimumOrderValue: number | null;
};

export type SelectedSlotSummary = {
  slotId: string;
  /** E.g. "IMPLICIT" | "ACTIVE" | "EXPLICIT" */
  state: string;
  /** Null when the selected slot is not in the list of delivery slots. */
  windowStart: string | null;
  windowEnd: string | null;
  /** False when Picnic preselected the slot (state "IMPLICIT"), true when the user picked it. */
  isExplicitSelection: boolean;
};

export type DeliverySlotOverview = {
  /** In the order of the API response. */
  slots: DeliverySlotSummary[];
  selectedSlot: SelectedSlotSummary | null;
};

// ─── Cart contents (parsed) ───────────────────────────────────────────────────

/** A label on a cart line, e.g. "Family" or "1+1 gratis", with its colors when Picnic sets them. */
export type CartLineLabel = {
  text: string;
  textColor: string | null;
  backgroundColor: string | null;
};

/** A product offered instead of an unavailable one. */
export type CartReplacement = {
  id: string;
  name: string;
  imageId: string | null;
  /** Price in cents. */
  displayPrice: number;
  unitQuantity: string;
  maxCount: number;
};

/** A line of the cart: one product and how many of it. Decorator overrides are applied. */
export type CartLineItem = {
  /** The order line id. */
  id: string;
  /** The product (selling unit) id, e.g. s1001524. */
  productId: string;
  name: string;
  /** The package size, e.g. "500 gram". */
  unitQuantity: string;
  imageId: string | null;
  quantity: number;
  maxCount: number;
  /** The price of the line in cents, after discounts (e.g. a member price). */
  displayPrice: number;
  /** The price of the line before discounts, or null when there is no discount. */
  originalPrice: number | null;
  /** The color token of the price, e.g. "RED2", or null for the default. */
  priceColor: string | null;
  /** The product's price tiers, or null when its price doesn't depend on the quantity. */
  priceRanges: PriceRange[] | null;
  /** Promotion and other labels, e.g. "Family". */
  labels: CartLineLabel[];
  /** The unit price text (BASE_PRICE), e.g. "€3.98/kg", or null. */
  basePrice: string | null;
  /** How long the product stays fresh (FRESH_LABEL), or null. */
  freshness: string | null;
  /** Product characteristics, e.g. "ORGANIC" or "FROZEN". */
  characteristics: string[];
  /** True when the product can't be delivered in the selected slot. */
  isUnavailable: boolean;
  /** Why, as the app shows it, or null. */
  unavailableReason: string | null;
  replacements: CartReplacement[];
  /** The recipe (selling group) the line was added for, or null. */
  recipeId: string | null;
};

/** A recipe in the cart, from the basket sections. */
export type CartRecipe = {
  /** The recipe's selling group id. */
  id: string;
  title: string;
  /** The line above the title, e.g. "2 porties", or null. */
  preTitle: string | null;
  /** The line below the title, e.g. "6 ingrediënten", or null. */
  subtitle: string | null;
  imageId: string | null;
};

/** The deposit for one kind of container. */
export type CartDeposit = {
  type: "BAG" | "DEFAULT" | string;
  /** Deposit per container in cents. */
  value: number;
  count: number;
  /** value × count. */
  total: number;
};

/** A fee or credit line, e.g. a Picnic credit settlement. */
export type CartFee = {
  type: string;
  name: string;
  /** In cents; negative for a credit. */
  amount: number;
};

/** The cart as the app's basket shows it. Amounts are in cents. */
export type CartContents = {
  /** The lines in the order of the response. */
  items: CartLineItem[];
  /** The number of products. */
  totalCount: number;
  /** The amount to pay, including deposits and fees (`checkout_total_price`). */
  totalPrice: number;
  /** The sum of the line discounts (original price minus display price). */
  discount: number;
  /** Savings from promotions, without the membership discount (`total_savings`). */
  promotionSavings: number;
  /** Savings from the membership, e.g. Family prices. */
  membershipSavings: number;
  deposits: CartDeposit[];
  depositTotal: number;
  /** Fees and credits that aren't zero. */
  fees: CartFee[];
  /** The minimum order value of the selected slot, or null. */
  minimumOrderValue: number | null;
  selectedSlot: SelectedSlotSummary | null;
  recipes: CartRecipe[];
};

// ─── Basket footer ────────────────────────────────────────────────────────────

/** A text from the basket footer, with its color when Picnic sets one. */
export type CartFooterText = {
  text: string;
  color: string | null;
};

/** A product tile in the "Niets vergeten?" row. */
export type CartRecommendationTile = {
  productId: string;
  imageId: string;
  backgroundColor: string | null;
  /** Whether the tile shows the promotion marker. */
  hasPromo: boolean;
};

export type CartRecommendations = {
  title: string;
  /** The page that lists all recommendations. */
  pageId: string;
  tiles: CartRecommendationTile[];
};

/** The basket footer. Loyalty points and recommendations are null when Picnic omits them. */
export type CartFooter = {
  loyaltyPoints: { label: CartFooterText; value: CartFooterText } | null;
  recommendations: CartRecommendations | null;
};

export type SetDeliverySlotInput = {
  slot_id: string;
};

export type RemoveGroupInput = {
  group_id: string;
};

export type OrderStatus = {
  checkout_status: "FINISHED" | string;
};

export type UserSlotMinimumOrderValue = {
  slot_id: string;
  minimum_order_value: number;
};

export type CheckoutConfirmation = {
  order_id: string;
  delivery_slot: DeliverySlot;
  analytics: Record<string, any> | null;
};

// ─── Checkout ───────────────────────────────────────────────────────────────

export type CheckoutStartInput = {
  mts: number;
  oos_article_ids?: string[] | null;
  resolve_key?: string;
};

export type CheckoutStartResult = {
  order_id: string;
  total_price: number;
  total_count: number;
  total_deposit: number;
  total_savings: number;
  transaction_expiry: string;
  delivery_slots: DeliverySlot[];
  deposit_breakdown: DepositBreakdown[];
  address?: {
    street?: string;
    city?: string;
    postcode?: string;
    house_number?: number;
  };
};

export type InitiatePaymentInput = {
  order_id: string;
  app_return_url: string;
};

export type PaymentAction = {
  type: string;
  redirect_url: string;
};

export type InitiatePaymentResult = {
  payment_id: string;
  transaction_id: string;
  issuer_authentication_url?: string;
  action: PaymentAction;
};

export type CheckoutStatusResult = {
  checkout_status: "FINISHED" | string;
};

export type CancelCheckoutInput = {
  transaction_id: string;
};
