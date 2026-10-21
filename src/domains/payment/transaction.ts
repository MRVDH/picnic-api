import { readCartLine } from "../cart/contents";
import type { OrderLine } from "../cart/types";
import { readReturnedContainers } from "../delivery/details";
import type { WalletPayment, WalletSubstitution, WalletTransactionDetails } from "./types";

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : null;
const asRecords = (value: unknown): RawRecord[] =>
  Array.isArray(value) ? value.flatMap((v): RawRecord[] => (asRecord(v) ? [asRecord(v)!] : [])) : [];
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const firstImage = (raw: RawRecord | null): string | null => asString(Array.isArray(raw?.image_ids) ? raw!.image_ids[0] : null);

/** The articles (products) of the order lines, by id. */
function articlesById(lines: RawRecord[]): Map<string, RawRecord> {
  const articles = new Map<string, RawRecord>();
  for (const line of lines) {
    for (const article of asRecords(line.items)) {
      const id = asString(article.id);
      if (id) articles.set(id, article);
    }
  }
  return articles;
}

/** A refund with substitutions: the missing product (from the order lines) and what replaced it. */
function readSubstitution(refund: RawRecord, articles: Map<string, RawRecord>): WalletSubstitution | null {
  const replacements = asRecords(refund.substitutions).map((sub) => ({
    name: asString(sub.name) ?? "",
    imageId: firstImage(sub),
    quantity: asNumber(sub.quantity, 1),
  }));
  if (replacements.length === 0) return null;
  const article = articles.get(asString(refund.article_id) ?? "") ?? null;
  return {
    original: { name: asString(article?.name) ?? "", imageId: firstImage(article), quantity: asNumber(refund.quantity, 1) },
    refundAmount: asNumber(refund.amount),
    replacements,
  };
}

/**
 * Turns a wallet transaction (from {@link PaymentService.getWalletTransactionDetails}) into a
 * {@link WalletPayment}. Products that were substituted show in `substitutions`, not in `items`,
 * as in the app.
 */
export function extractWalletPayment(transactionId: string, transaction: WalletTransactionDetails): WalletPayment {
  const raw = (asRecord(transaction) ?? {}) as RawRecord;
  const lines = asRecords(raw.shop_items);
  const articles = articlesById(lines);
  const refunds = asRecords(raw.article_issue_refunds);
  const substitutedIds = new Set(refunds.filter((refund) => asRecords(refund.substitutions).length > 0).map((refund) => asString(refund.article_id)));
  const items = lines
    .filter((line) => !asRecords(line.items).some((article) => substitutedIds.has(asString(article.id))))
    .flatMap((line) => readCartLine(line as unknown as OrderLine) ?? []);
  const returnedContainers = readReturnedContainers(raw.returned_containers);
  const displayName = asString(raw.payment_option_display_name);
  const paidAt = asNumber(raw.payment_execution_timestamp);

  return {
    id: transactionId,
    deliveryId: asString(raw.delivery_id),
    paidAt: paidAt > 0 ? paidAt : null,
    amount: asNumber(raw.amount_in_cents),
    type: asString(raw.transaction_type) ?? "",
    status: asString(raw.transaction_status) ?? "",
    items,
    substitutions: refunds.flatMap((refund) => readSubstitution(refund, articles) ?? []),
    depositTotal: asRecords(raw.deposits).reduce((sum, deposit) => sum + asNumber(deposit.value) * asNumber(deposit.count), 0),
    returnedContainers,
    returnedDepositTotal: returnedContainers.reduce((sum, container) => sum + container.price, 0),
    paymentMethod: displayName
      ? { displayName, account: asString(raw.payment_option_account), iconUrl: asString(raw.payment_method_icon_url) }
      : null,
  };
}
