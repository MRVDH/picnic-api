import { CartDeposit, CartFee, CartLineItem, DeliverySlot, DeliveryStatus, Order } from "../cart/types";

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
export type DeliveryOrder = {
  type: "ORDER";
  id: string;
  creation_time: string;
  total_price: number;
  status: DeliveryStatus;
  cancellation_time: string | null;
};

// ─── Delivery ─────────────────────────────────────────────────────────────────

export type Delivery = {
  delivery_id: string;
  creation_time: string;
  slot: DeliverySlot;
  eta2: DeliveryTime;
  status: DeliveryStatus;
  delivery_time: DeliveryTime;
  orders: DeliveryOrder[];
};

export type ReturnedContainer = {
  type: string;
  localized_name: string;
  quantity: number;
  price: number;
};

/**
 * Full delivery detail returned by GET /deliveries/{deliveryId}.
 * Includes type discriminator, full order objects with items, returned containers, and parcels.
 */
export type DeliveryDetail = Omit<Delivery, "orders"> & {
  type: "DELIVERY";
  /** Same value as delivery_id; provided by the API for convenience. */
  id: string;
  orders: Order[];
  returned_containers: ReturnedContainer[];
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

export type DeliveryScenario = {
  version: number;
  scenario: ScenarioEntry[];
  vehicle: Vehicle;
  driver?: DeliveryDriver;
  trailers?: Vehicle[];
  destination?: DeliveryAddress;
};

export type DeliveryPosition = {
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
export type ReturnedContainerSummary = {
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
export type DeliveryOrderDetails = {
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
export type DeliveryDetails = {
  id: string;
  status: DeliveryStatus;
  creationTime: string;
  windowStart: string | null;
  windowEnd: string | null;
  orders: DeliveryOrderDetails[];
  returnedContainers: ReturnedContainerSummary[];
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

/** Where a delivery is, combining its position (polled) and its route (the scenario). */
export type DeliveryTracking = {
  /** The version of the route; when the position reports another, fetch the route again. */
  scenarioVersion: number;
  /** True while the driver is on the way; poll again after `queryInterval`. */
  inProgress: boolean;
  /** How long to wait before polling the position again, in milliseconds. */
  queryInterval: number;
  /** The expected arrival in epoch milliseconds, or null. */
  eta: number | null;
  etaWindowStart: string | null;
  etaWindowEnd: string | null;
  /** The route point closest to the position's time, or null without a route. */
  currentPosition: DeliveryRoutePoint | null;
  route: DeliveryRoutePoint[];
  driverName: string | null;
  driverPhotoUrl: string | null;
  vehicleName: string | null;
  /** The vehicle image as a data URL, or null. */
  vehicleImageDataUrl: string | null;
  destination: { lat: number; lng: number; street: string | null; city: string | null; postcode: string | null } | null;
};
