import { DeliveryStatus } from "../cart/types";
import { DeliverySummary } from "./types";

type RawObject = Record<string, unknown>;

const isRawObject = (val: unknown): val is RawObject =>
  typeof val === "object" && val !== null && !Array.isArray(val);

const asText = (val: unknown): string => (typeof val === "string" ? val : "");

const asAmount = (val: unknown): number => (typeof val === "number" && Number.isFinite(val) ? val : 0);

const asObject = (val: unknown): RawObject | null => (isRawObject(val) ? val : null);

/** Takes the delivery window from the slot, then delivery_time, then eta2, whichever is set first. */
function extractDeliveryWindow(raw: RawObject): { windowStart: string | null; windowEnd: string | null } {
  const slot = asObject(raw["slot"]);
  const deliveryTime = asObject(raw["delivery_time"]);
  const eta2 = asObject(raw["eta2"]);

  const windowStart =
    asText(slot?.["window_start"]) || asText(deliveryTime?.["start"]) || asText(eta2?.["start"]) || null;
  const windowEnd =
    asText(slot?.["window_end"]) || asText(deliveryTime?.["end"]) || asText(eta2?.["end"]) || null;

  return { windowStart, windowEnd };
}

function extractDeliverySummary(raw: unknown): DeliverySummary | null {
  if (!isRawObject(raw)) return null;

  const id = asText(raw["delivery_id"]) || asText(raw["id"]);
  if (!id) return null;

  const { windowStart, windowEnd } = extractDeliveryWindow(raw);
  const orders = (Array.isArray(raw["orders"]) ? raw["orders"] : []).filter(isRawObject);

  let totalPrice = 0;
  let itemCount = asAmount(raw["total_count"]) || asAmount(raw["sellable_item_count"]);
  for (const order of orders) {
    totalPrice += asAmount(order["total_price"]) || asAmount(order["checkout_total_price"]);
    // Summary orders are slim, so total_count only exists on full order objects.
    itemCount += asAmount(order["total_count"]) || asAmount(order["sellable_item_count"]);
  }

  return {
    id,
    status: (asText(raw["status"]) || "COMPLETED") as DeliveryStatus,
    creationTime: asText(raw["creation_time"]),
    windowStart,
    windowEnd,
    orderCount: orders.length,
    totalPrice,
    itemCount,
  };
}

/**
 * Maps the raw body of POST /deliveries/summary to DeliverySummary entries, newest first.
 * Entries without an id are dropped. Upcoming deliveries have a future window start, so they
 * sort to the top without a separate status sort.
 */
export function extractDeliverySummaries(raw: unknown): DeliverySummary[] {
  const summaries = (Array.isArray(raw) ? raw : [])
    .map(extractDeliverySummary)
    .filter((summary): summary is DeliverySummary => summary !== null);

  const sortKey = (summary: DeliverySummary) => summary.windowStart ?? summary.creationTime;
  return summaries.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}
