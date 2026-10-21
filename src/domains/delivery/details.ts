import { readCartLine, readDeposits, readFees } from "../cart/contents";
import type { DeliveryStatus, Order } from "../cart/types";
import type {
  RawDelivery,
  Delivery,
  DeliveryOrder,
  DeliveryPayment,
  RawDeliveryPosition,
  DeliveryRoutePoint,
  RawDeliveryScenario,
  DeliveryTracking,
  DeliveryPosition,
  DeliveryRoute,
  ReturnedContainer,
} from "./types";

type RawRecord = Record<string, unknown>;

const asRecord = (value: unknown): RawRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : null;
const asRecords = (value: unknown): RawRecord[] =>
  Array.isArray(value) ? value.flatMap((v): RawRecord[] => (asRecord(v) ? [asRecord(v)!] : [])) : [];
const asString = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null);
const asNumber = (value: unknown, fallback = 0): number => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

/** Reads the returned containers (`returned_containers`) of a delivery or a payment. */
export function readReturnedContainers(raw: unknown): ReturnedContainer[] {
  return asRecords(raw).map((entry) => ({
    type: asString(entry.type) ?? "",
    name: asString(entry.localized_name) ?? asString(entry.type) ?? "",
    quantity: asNumber(entry.quantity),
    price: asNumber(entry.price),
  }));
}

function readPayment(raw: unknown): DeliveryPayment | null {
  const info = asRecord(raw);
  const paymentType = asString(info?.payment_type);
  const redactedIban = asString(info?.redacted_iban);
  if (!paymentType && !redactedIban) return null;
  return { paymentType, redactedIban, bankId: asString(info?.bank_id) };
}

function readOrder(order: Order): DeliveryOrder | null {
  const raw = order as unknown as RawRecord;
  const id = asString(raw.id);
  if (!id) return null;
  const deposits = readDeposits(raw.deposit_breakdown);
  const depositTotal = deposits.reduce((sum, deposit) => sum + deposit.total, 0);
  return {
    id,
    status: (asString(raw.status) ?? "COMPLETED") as DeliveryStatus,
    creationTime: asString(raw.creation_time) ?? "",
    items: (order.items ?? []).flatMap((line) => readCartLine(line, order.decorator_overrides ?? {}) ?? []),
    totalPrice: asNumber(raw.total_price),
    checkoutTotalPrice: asNumber(raw.checkout_total_price),
    promotionSavings: asNumber(raw.total_savings),
    membershipSavings: asNumber(raw.membership_savings),
    deposits,
    depositTotal: asNumber(raw.total_deposit) || depositTotal,
    fees: readFees(raw.fees),
    cancellable: raw.cancellable === true,
    payment: readPayment(raw.transaction_info),
  };
}

/**
 * Turns a delivery (`/deliveries/{id}`) into {@link Delivery}: its
 * orders with their lines read like the cart's, and the totals over all orders.
 */
export function extractDelivery(delivery: RawDelivery): Delivery {
  const raw = delivery as unknown as RawRecord;
  // The window comes from the slot, then delivery_time, then eta2, as in getDeliverySummaries.
  const slot = asRecord(raw.slot);
  const deliveryTime = asRecord(raw.delivery_time);
  const eta2 = asRecord(raw.eta2);
  const orders = (delivery.orders ?? []).flatMap((order) => readOrder(order) ?? []);
  const items = orders.flatMap((order) => order.items);
  const deposits = orders.flatMap((order) => order.deposits);

  return {
    id: asString(raw.delivery_id) ?? asString(raw.id) ?? "",
    status: (asString(raw.status) ?? "COMPLETED") as DeliveryStatus,
    creationTime: asString(raw.creation_time) ?? "",
    windowStart: asString(slot?.window_start) ?? asString(deliveryTime?.start) ?? asString(eta2?.start),
    windowEnd: asString(slot?.window_end) ?? asString(deliveryTime?.end) ?? asString(eta2?.end),
    orders,
    returnedContainers: readReturnedContainers(raw.returned_containers),
    totalPrice: orders.reduce((sum, order) => sum + order.checkoutTotalPrice, 0),
    totalCount: items.reduce((sum, item) => sum + item.quantity, 0),
    // Line prices are totals for the line's quantity.
    discount: items.reduce((sum, item) => sum + (item.originalPrice !== null ? item.originalPrice - item.displayPrice : 0), 0),
    promotionSavings: orders.reduce((sum, order) => sum + order.promotionSavings, 0),
    membershipSavings: orders.reduce((sum, order) => sum + order.membershipSavings, 0),
    deposits,
    depositTotal: deposits.reduce((sum, deposit) => sum + deposit.total, 0),
    fees: orders.flatMap((order) => order.fees),
    cancellable: orders.some((order) => order.cancellable),
  };
}

function readRoutePoint(raw: RawRecord): DeliveryRoutePoint | null {
  const lat = asNumber(raw.lat);
  const lng = asNumber(raw.lng);
  return lat === 0 && lng === 0 ? null : { lat, lng, ts: asNumber(raw.ts) };
}

/** The route point closest in time to `ts`. */
function closestPoint(route: DeliveryRoutePoint[], ts: number): DeliveryRoutePoint | null {
  let best: DeliveryRoutePoint | null = null;
  for (const point of route) {
    if (!best || Math.abs(point.ts - ts) < Math.abs(best.ts - ts)) best = point;
  }
  return best;
}

/** Reads a delivery's position (`/deliveries/{id}/position`). */
export function extractDeliveryPosition(raw: RawDeliveryPosition): DeliveryPosition {
  const pos = asRecord(raw) ?? {};
  const etaWindow = asRecord(pos.eta_window);
  return {
    routeVersion: asNumber(pos.version),
    inProgress: pos.scenario_in_progress === true,
    queryInterval: asNumber(pos.query_interval, 15000),
    eta: asNumber(pos.eta) || null,
    etaWindowStart: asString(etaWindow?.start),
    etaWindowEnd: asString(etaWindow?.end),
    routeTime: asNumber(pos.scenario_ts),
  };
}

/** Reads a delivery's route (`/deliveries/{id}/scenario`); the destination falls back to the end of the route. */
export function extractDeliveryRoute(raw: RawDeliveryScenario): DeliveryRoute {
  const scenario = asRecord(raw) ?? {};
  const points = asRecords(scenario.scenario).flatMap((point) => readRoutePoint(point) ?? []);
  const driver = asRecord(scenario.driver);
  const vehicle = asRecord(scenario.vehicle);
  const destination = asRecord(scenario.destination);
  const end = points[points.length - 1];
  const lat = asNumber(destination?.lat) || (end?.lat ?? 0);
  const lng = asNumber(destination?.lng) || (end?.lng ?? 0);
  const image = asString(vehicle?.image);

  return {
    version: asNumber(scenario.version),
    points,
    driverName: asString(driver?.name),
    driverPhotoUrl: asString(driver?.photo_url),
    vehicleName: asString(vehicle?.name),
    vehicleImageDataUrl: image ? (image.startsWith("data:") ? image : `data:image/png;base64,${image}`) : null,
    destination:
      lat !== 0 || lng !== 0
        ? { lat, lng, street: asString(destination?.street), city: asString(destination?.city), postcode: asString(destination?.postcode) }
        : null,
  };
}

/** Combines a position and a route: the position points into the route by time (`routeTime`). */
export function combineDeliveryTracking(position: DeliveryPosition, route: DeliveryRoute): DeliveryTracking {
  return { ...position, currentPosition: closestPoint(route.points, position.routeTime), route };
}
