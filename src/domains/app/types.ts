import type { FusionComponent, Icon } from "../../pages/fusion";

export type RawDeeplinkResolution = {
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
export type RawMessages = {
  messages: Message[];
  query_interval: number | null; // polling interval in milliseconds
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────

// ─── Enums ───────────────────────────────────────────────────────────────────

export type TabType = "PAGE" | "CART" | "LEGACY_SEARCH" | "SEARCH" | "UNSUPPORTED" | string;

export type TabDecoratorType = "GIFT" | "NOTIFICATION" | "PRICE_BALLOON" | "NOTIFY_TAP" | "UNSUPPORTED" | string;

export type TabTargetType = "PICNIC_PAGE_REFERENCE" | "DEEPLINK" | "UNSUPPORTED" | string;

export type TabIconType = "PRESET" | "BASE_64" | "UNSUPPORTED" | string;

export type DynamicIconConfigType = "CART_VALUE" | "UNSUPPORTED" | string;

/**
 * Preset tab bar icons. App 1.251.0 knows only the `_2` variants, `CHECKMARK`, `TRANSFER_PLANNER`,
 * `HEART`, `POT`, `SEARCH` and `UNSUPPORTED`; the others are kept because older app versions use them.
 */
export type PresetIcon =
  | "BASKET"
  | "BASKET_2"
  | "ACTIVE_PROMO"
  | "CHECKMARK"
  | "EPV"
  | "EPV_2"
  | "HEART"
  | "POT"
  | "PROFILE"
  | "PROMO"
  | "ROCKET"
  | "ROCKET_2"
  | "SEARCH"
  | "SEARCH_2"
  | "STOREFRONT"
  | "STOREFRONT_2"
  | "TROLLEY"
  | "TROLLEY_2"
  | "TRANSFER_PLANNER"
  | "UNSUPPORTED"
  | string;

// ─── Icons ───────────────────────────────────────────────────────────────────

/** Dynamic cart-value-based icon config (e.g. show different icon based on cart value). */
export type CartValueDynamicIconConfig = {
  type: "CART_VALUE";
  lower_bound?: number | null;
  upper_bound?: number | null;
};

export type UnsupportedDynamicIconConfig = {
  type: "UNSUPPORTED" | string;
};

export type DynamicIconConfig = CartValueDynamicIconConfig | UnsupportedDynamicIconConfig;

/** Preset (vector/SVG) icon tab bar item. */
export type PresetTabIcon = {
  type: "PRESET";
  preset?: PresetIcon | null;
  dynamic_config?: DynamicIconConfig | null;
  allow_tint_color?: boolean | null;
};

/** Base64-encoded image tab bar icon. */
export type Base64TabIcon = {
  type: "BASE_64";
  value?: string | null;
  dynamic_config?: DynamicIconConfig | null;
  allow_tint_color?: boolean | null;
};

export type UnsupportedTabIcon = {
  type: "UNSUPPORTED" | string;
  allow_tint_color?: boolean | null;
};

export type TabIcon = PresetTabIcon | Base64TabIcon | UnsupportedTabIcon;

/** Icon configuration for a tab bar item, including default and highlighted states. */
export type IconConfig = {
  icons: TabIcon[];
  highlight_icons?: TabIcon[] | null;
  color: string;
  highlight_color: string;
};

// ─── Tab Target ───────────────────────────────────────────────────────────────

/** Navigates to an internal Picnic page by reference. */
export type PageTabTarget = {
  type: "PICNIC_PAGE_REFERENCE";
  reference: string;
  request_params?: Record<string, string> | null;
};

/** Opens an external deep-link URL. */
export type DeeplinkTabTarget = {
  type: "DEEPLINK";
  deeplink?: string | null;
};

export type UnsupportedTabTarget = {
  type: "UNSUPPORTED" | string;
};

export type TabTarget = PageTabTarget | DeeplinkTabTarget | UnsupportedTabTarget;

// ─── Tab Decorator ────────────────────────────────────────────────────────────

/** Controls a visual badge/decorator rendered on top of a tab icon. */
export type TabDecorator = {
  type: TabDecoratorType;
  /** Display positions that trigger this decorator's notification dot. */
  display_positions_to_notify?: string[] | null;
};

// ─── Tab Accessibility ────────────────────────────────────────────────────────

export type TabAccessibility = {
  label: string;
  hint: string;
};

// ─── Message Behaviour ────────────────────────────────────────────────────────

/** Defines which display positions this tab renders messages for. */
export type MessageBehaviour = {
  display_positions_to_render: string[];
};

/** Global message polling configuration; defines which positions are polled. */
export type GeneralMessageBehaviour = {
  display_positions_to_poll: string[];
};

// ─── Tab ─────────────────────────────────────────────────────────────────────

export type BootstrapTab = {
  id: string;
  tab_type: TabType;
  analytics_id?: string | null;
  icon_config: IconConfig;
  message_behaviour: MessageBehaviour;
  tab_decorators?: TabDecorator[] | null;
  accessibility: TabAccessibility;
  /** Navigation target; omitted for tabs that handle navigation internally (e.g. CART). */
  target?: TabTarget | null;
  header?: string | null;
  title?: string | null;
  title_config?: TitleConfig | null;
};

export type TitleConfig = {
  title: string;
  color: string;
  highlight_color: string;
};

// ─── Third-party Configs ──────────────────────────────────────────────────────

/** Braze SDK initialisation token. */
export type BrazeConfig = {
  authentication_token: string;
};

/** Datadog RUM / APM configuration. */
export type DatadogConfig = {
  rum_session_sample_rate: number;
  apm_trace_sample_rate: number;
};

// ─── In-app Feature Config ────────────────────────────────────────────────────

/** Timeout for the pre-checkout upsell check before the cart proceeds. */
export type CartPreCheckoutUpsellConfig = {
  timeout_ms: number | null;
};

export type InAppFeatureConfig = {
  cart_pre_checkout_upsell_check?: CartPreCheckoutUpsellConfig | null;
  /**
   * Base URL of the JavaScript chunks for the client components of RSC pages, e.g.
   * `https://pages-prod.nl.picnicinternational.com/store`. A chunk id from an RSC module
   * reference is fetched from `<base>/<chunk id>.script.bundle`.
   */
  client_component_cdn_base_url?: string | null;
};

/** The root response returned by `GET /bootstrap`. */
export type RawBootstrapData = {
  landing_tab_id: string;
  tabs: BootstrapTab[];
  general_message_behaviour: GeneralMessageBehaviour;
  datadog_config: DatadogConfig | null;
  braze_config: BrazeConfig | null;
  in_app_feature_config: InAppFeatureConfig | null;
  first_time_user: boolean;
};
