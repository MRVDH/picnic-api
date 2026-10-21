import { CartLineItem, OrderLine } from "../cart/types";
import type { ReturnedContainer } from "../delivery/types";

// ─── Payment Profile ──────────────────────────────────────────────────────────

export type BankInformation = {
  bank_id: string;
  name: string;
};

export type AvailablePaymentMethod = {
  available_banks?: BankInformation[];
  payment_method: string;
};

export type PaymentMethodBrand = {
  brand: string;
  display_name: string;
  icon_url: string;
};

export type PaymentMethod = {
  brands: PaymentMethodBrand[];
  data: object;
  display_name: string;
  icon_url: string;
  payment_method: string;
  visibility: string;
  visibility_reason: null | string;
};

export type StoredPaymentOption = {
  account: string | null;
  brand: string;
  display_name: string;
  icon_url: string;
  id: string;
  payment_method: string;
};

export type RawPaymentProfile = {
  available_payment_method_item: unknown | null;
  available_payment_methods: AvailablePaymentMethod[];
  checkout_banner: unknown | null;
  payment_methods: PaymentMethod[];
  preferred_payment_option_id: string;
  stored_payment_options: StoredPaymentOption[];
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletTransactionsInput = {
  page_number: number;
};

export type RawWalletTransactionSummary = {
  account: string;
  amount_in_cents: number;
  brand: string;
  display_name: string;
  domains: string[];
  icon_url: string;
  id: string;
  status: string;
  timestamp: number;
  transaction_method: string;
  transaction_type: string;
};

export type RawReturnedContainer = {
  localized_name: string;
  price: number;
  quantity: number;
  type: string;
};

export type Deposit = {
  count: number;
  type: string;
  value: number;
};

export type RawWalletTransaction = {
  amount_in_cents: number;
  article_issue_refunds: unknown[];
  debt_resolution: unknown | null;
  delivery_debt: unknown | null;
  delivery_id: string;
  deposits: Deposit[];
  fees: unknown[];
  payment_execution_timestamp: number;
  payment_method_icon_url: string;
  payment_option_account: string;
  payment_option_display_name: string;
  refunded_items: unknown[];
  returned_containers: RawReturnedContainer[];
  shop_items: OrderLine[];
  transaction_method: string;
  transaction_status: string;
  transaction_type: string;
};

// ─── Wallet transaction (parsed) ──────────────────────────────────────────────

/** A product that was missing at delivery and what replaced it. */
export type WalletSubstitution = {
  /** The missing product, looked up in the order lines. */
  original: { name: string; imageId: string | null; quantity: number };
  /** The amount refunded for the missing product, in cents. */
  refundAmount: number;
  replacements: { name: string; imageId: string | null; quantity: number }[];
};

/** A payment as the app's wallet shows it ("Betaling"), with the order lines it covers. Amounts are in cents. */
export type WalletTransaction = {
  id: string;
  deliveryId: string | null;
  /** The payment time in epoch milliseconds, or null. */
  paidAt: number | null;
  amount: number;
  /** "PAYMENT", or e.g. "REFUND" for money back. */
  type: string;
  status: string;
  /** The order lines, without the substituted products (see `substitutions`). */
  items: CartLineItem[];
  substitutions: WalletSubstitution[];
  /** Deposits paid. */
  depositTotal: number;
  returnedContainers: ReturnedContainer[];
  /** Deposits returned. */
  returnedDepositTotal: number;
  paymentMethod: { displayName: string; account: string | null; iconUrl: string | null } | null;
};
