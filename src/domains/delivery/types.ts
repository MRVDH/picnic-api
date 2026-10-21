import { CartDeposit, CartFee, CartLineItem, RawDeliverySlot, DeliveryStatus, Order } from "../cart/types";

// ─── Delivery Time & Status ───────────────────────────────────────────────────

export type DeliveryTime = {
  start: string;
  end: string;
};

// ─── Order summary as returned inside the deliveries list ─────────────────────

/**
 * Slim order summary returned as part of GET /deliveries/summary.
 * The full Order type (with items, totals, etc.) is returned by getDelivery().
 */
export type RawDeliveryOrder = {
  type: "ORDER";
  id: string;
  creation_time: string;
  total_price: number;
  status: DeliveryStatus;
  cancellation_time: string | null;
};

// ─── Delivery ─────────────────────────────────────────────────────────────────

export type RawDeliverySummary = {
  delivery_id: string;
  creation_time: string;
  slot: RawDeliverySlot;
  eta2: DeliveryTime;
  status: DeliveryStatus;
  delivery_time: DeliveryTime;
  orders: RawDeliveryOrder[];
};

export type RawReturnedContainer = {
  type: string;
  localized_name: string;
  quantity: number;
  price: number;
};

/**
 * Full delivery detail returned by GET /deliveries/{deliveryId}.
 * Includes type discriminator, full order objects with items, returned containers, and parcels.
 */
export type RawDelivery = Omit<RawDeliverySummary, "orders"> & {
  type: "DELIVERY";
  /** Same value as delivery_id; provided by the API for convenience. */
  id: string;
  orders: Order[];
  returned_containers: RawReturnedContainer[];
  parcels: any[];
};

// ─── Delivery Summary ─────────────────────────────────────────────────────────

/**
 * One entry of the deliveries list, as returned by getDeliverySummaries().
 * Totals are summed over the delivery's orders, in the same unit as Picnic's raw prices.
 */
export type DeliverySummary = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  windowStart: string | null;
  windowEnd: string | null;
  orderCount: number;
  totalPrice: number;
  itemCount: number;
};

// ─── Delivery Tracking ────────────────────────────────────────────────────────

export type Vehicle = {
  /** Base64-encoded image of the vehicle. */
  image: string;
  name?: string;
};

export type DeliveryDriver = {
  name: string;
  photo_url?: string;
};

export type DeliveryAddress = {
  id?: string;
  postcode: string;
  house_number: number;
  house_number_extension?: string;
  street?: string;
  city?: string;
};

/** A single entry in the delivery route scenario. */
export type ScenarioEntry = {
  /** Unix timestamp in milliseconds. */
  ts: number;
  lat: number;
  lng: number;
};

export type RawDeliveryScenario = {
  version: number;
  scenario: ScenarioEntry[];
  vehicle: Vehicle;
  driver?: DeliveryDriver;
  trailers?: Vehicle[];
  destination?: DeliveryAddress;
};

export type RawDeliveryPosition = {
  version: number;
  /** Unix timestamp in milliseconds pointing to the current scenario entry. */
  scenario_ts: number;
  /** Unix timestamp in milliseconds of the estimated arrival. */
  eta: number;
  eta_window: DeliveryTime;
  /** Polling interval in milliseconds. */
  query_interval: number;
  scenario_in_progress: boolean;
};

// ─── Delivery details (parsed) ────────────────────────────────────────────────

/** Containers returned at a delivery, e.g. crates or bottles. */
export type ReturnedContainer = {
  type: string;
  /** The name the app shows, e.g. "Kratten". */
  name: string;
  quantity: number;
  /** The deposit returned for these containers in cents, for the whole quantity. */
  price: number;
};

/** How an order was paid. */
export type DeliveryPayment = {
  paymentType: string | null;
  /** The account, partly hidden, e.g. "NL** **** **** **** 1234". */
  redactedIban: string | null;
  bankId: string | null;
};

/** One order of a delivery. Amounts are in cents. */
export type DeliveryOrder = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  /** The order lines, read like the cart's ({@link CartLineItem}). */
  items: CartLineItem[];
  totalPrice: number;
  /** The amount paid, including deposits and fees. */
  checkoutTotalPrice: number;
  promotionSavings: number;
  membershipSavings: number;
  deposits: CartDeposit[];
  depositTotal: number;
  fees: CartFee[];
  cancellable: boolean;
  payment: DeliveryPayment | null;
};

/** A delivery with its orders, as the app's order history shows it. Amounts are in cents. */
export type Delivery = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  windowStart: string | null;
  windowEnd: string | null;
  orders: DeliveryOrder[];
  returnedContainers: ReturnedContainer[];
  /** The amount paid over all orders. */
  totalPrice: number;
  /** The number of products over all orders. */
  totalCount: number;
  /** The sum of the line discounts. */
  discount: number;
  promotionSavings: number;
  membershipSavings: number;
  deposits: CartDeposit[];
  depositTotal: number;
  fees: CartFee[];
  /** True when one of the orders can still be cancelled. */
  cancellable: boolean;
};

// ─── Delivery tracking (parsed) ───────────────────────────────────────────────

/** A point of the driver's route, with its time in epoch milliseconds. */
export type DeliveryRoutePoint = {
  lat: number;
  lng: number;
  ts: number;
};

/** A delivery's position, which the app polls while the driver is on the way. */
export type DeliveryPosition = {
  /** The version of the route; when it differs from the route you have, fetch the route again. */
  routeVersion: number;
  /** True while the driver is on the way; poll again after `queryInterval`. */
  inProgress: boolean;
  /** How long to wait before polling the position again, in milliseconds. */
  queryInterval: number;
  /** The expected arrival in epoch milliseconds, or null. */
  eta: number | null;
  etaWindowStart: string | null;
  etaWindowEnd: string | null;
  /** The time on the route where the driver is, in epoch milliseconds (compare with `DeliveryRoutePoint.ts`). */
  routeTime: number;
};

/** Where a delivery goes. */
export type DeliveryDestination = {
  lat: number;
  lng: number;
  street: string | null;
  city: string | null;
  postcode: string | null;
};

/** A delivery's route and who drives it. It only changes when its `version` changes. */
export type DeliveryRoute = {
  version: number;
  /** The points of the route in time order. */
  points: DeliveryRoutePoint[];
  driverName: string | null;
  driverPhotoUrl: string | null;
  vehicleName: string | null;
  /** The vehicle image as a data URL, or null. */
  vehicleImageDataUrl: string | null;
  /** The destination, or the end of the route when the route has no destination; null without either. */
  destination: DeliveryDestination | null;
};

/** Where a delivery is: its position, its route and the point on the route the driver is at. */
export type DeliveryTracking = DeliveryPosition & {
  /** The route point closest to `routeTime`, or null without a route. */
  currentPosition: DeliveryRoutePoint | null;
  route: DeliveryRoute;
};

// ---
// Reminders
// ---

/**
 * Day of week for a reminder.
 * Maps to `DayOfWeek` in the Android app.
 */
export type ReminderDayOfWeek = "EMPTY" | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

/**
 * A single delivery reminder configuration.
 * Maps to `Reminder` in the Android app.
 */
export type Reminder = {
  day_of_week: ReminderDayOfWeek | null;
  time_of_day: number[] | null; // e.g. [8, 0] for 08:00
};

/**
 * Response wrapper for the GET /reminders endpoint.
 * Maps to `Reminders` in the Android app.
 */
export type RemindersWrapper = {
  reminders: Reminder[];
};

// ---
// Parcels
// ---

/**
 * The current tracking status of a parcel.
 */
export type ParcelCurrentStatus = {
  status: string; // e.g. "HANDED_OVER"
  timestamp: string; // ISO 8601 datetime string
};

/**
 * A tracked parcel (external delivery via a carrier such as DHL).
 */
export type Parcel = {
  id: string; // carrier tracking code
  handler_name: string; // e.g. "DHL"
  active: boolean;
  current_status: ParcelCurrentStatus;
};
