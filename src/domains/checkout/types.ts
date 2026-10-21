import type { DepositBreakdown, RawDeliverySlot } from "../cart/types";

export type OrderStatus = {
  checkout_status: "FINISHED" | string;
};

export type CheckoutConfirmation = {
  order_id: string;
  delivery_slot: RawDeliverySlot;
  analytics: Record<string, any> | null;
};

/** Options for {@link CheckoutService.startCheckout}. */
export type StartCheckoutOptions = {
  /** The cart's modification timestamp (`Cart.mts`); checkout fails when the cart changed since. */
  mts: number;
  /** The `resolveKey` of a `CheckoutIssueError` the user resolved, e.g. after confirming their age. */
  resolveKey?: string;
  /** Ids of out-of-stock articles the user accepted to leave out. */
  outOfStockArticleIds?: string[];
};

/** The body of `POST /cart/checkout/start`. */
export type CheckoutStartInput = {
  mts: number;
  oos_article_ids: string[] | null;
  resolve_key?: string;
};

export type CheckoutStartResult = {
  order_id: string;
  total_price: number;
  total_count: number;
  total_deposit: number;
  total_savings: number;
  transaction_expiry: string;
  delivery_slots: RawDeliverySlot[];
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
