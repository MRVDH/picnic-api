import type { FusionComponent } from "../../pages/fusion";

export type DeeplinkResolution = {
  url: string;
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
