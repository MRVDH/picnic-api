import { Component, Icon } from "../../types/fusion";
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
  price: number;
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
  decorators: Decorator[];
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

// ─── Cart Actions ─────────────────────────────────────────────────────────────

export type AddProductInput = {
  product_id: string;
  count: number;
};

export type GetDeliverySlotsResult = {
  delivery_slots: DeliverySlot[];
  slot_selector_message: SlotSelectorMessage;
  selected_slot: SelectedSlot;
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
