import { FusionComponent } from "../../types/fusion";

export type OpeningTime = {
  start: number[]; // e.g. [8, 0]
  end: number[]; // e.g. [23, 0]
};

export type OpeningTimes = {
  [date: string]: OpeningTime; // key is a date string e.g. "2026-02-25"
};

export type ContactDetails = {
  email: string;
  phone: string;
  whatsapp: string;
};

export type CustomerServiceContactInfo = {
  contact_details: ContactDetails;
  opening_times: OpeningTimes;
};

// ---
// Messages
// ---

/**
 * Where in the app the message is shown.
 * Maps to `Message.DisplayPosition` in the Android app.
 */
export type MessageDisplayPosition = "PROMPT" | "MESSAGE_BAR" | "ORDER_CONFIRMATION" | "STOREFRONT_DIALOG" | "UNSUPPORTED";

/**
 * A single in-app message (popup, banner, order-confirmation card, etc.).
 * Maps to `Message` in the Android app.
 */
export type Message = {
  display_position: MessageDisplayPosition;
  send_correlation_id: string;
  sent_time: number; // Unix timestamp in milliseconds
  expiry_time: number; // Unix timestamp in milliseconds
  user_id: string;
  target_entity_id: string | null;
  content: {
    pml_version: string;
    component: FusionComponent;
    images: Record<string, string>;
    tracking_attributes: { template_variant_id: string; entity_ids: string[] };
  };
};

/**
 * Response wrapper for the /messages endpoint.
 * Maps to `MessagesWrapper` in the Android app.
 */
export type MessagesWrapper = {
  messages: Message[];
  query_interval: number | null; // polling interval in milliseconds
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
