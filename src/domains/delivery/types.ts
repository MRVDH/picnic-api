import { DeliverySlot, DeliveryStatus, Order } from "../cart/types";

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
