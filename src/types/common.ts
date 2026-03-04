export type ApiConfig = {
  countryCode?: CountryCode;
  apiVersion?: string;
  authKey?: string;
  url?: string;
};

export type CountryCode = "NL" | "DE";

export type ImageSize = "tiny" | "small" | "medium" | "large" | "extra-large";

export type ApiError = {
  code: string;
  details: any;
  message: string;
};

export type Link = {
  type: string;
  href: string;
};

/** Utility type to tag an object with a discriminant `type` field. */
export type Tagged<Type, Obj> = { type: Type } & Obj;

// ─── Decorators ──────────────────────────────────────────────────────────────

export type BasePriceDecorator = {
  type: "BASE_PRICE";
  base_price_text: string;
};

export type FreshLabelDecorator = {
  type: "FRESH_LABEL";
  period: string;
};

export type LabelDecorator = {
  type: "LABEL";
  text: string;
};

export type PriceDecorator = {
  type: "PRICE";
  display_price: number;
};

export type QuantityDecorator = {
  type: "QUANTITY";
  quantity: number;
};

export type BackgroundImageDecorator = {
  type: "BACKGROUND_IMAGE";
  image_ids: string[];
  height_percent: number;
};

export type DeeplinkReference = {
  type: "DEEPLINK";
  target: string;
};

export type SubBanner = {
  banner_id: string;
  image_id: string;
  display_time: string;
  description: string;
  reference: DeeplinkReference;
  position: string;
};

export type BannersDecorator = {
  type: "BANNERS";
  height_percentage: number;
  banners: SubBanner[];
};

export type UnitQuantityDecorator = {
  type: "UNIT_QUANTITY";
  unit_quantity_text: string;
};

export type OrderedQuantityDecorator = {
  type: "ORDERED_QUANTITY";
  image_id: string;
  quantity: string;
};

export type ProductSizeDecorator = {
  type: "PRODUCT_SIZE";
  text: string;
};

export type ValidityLabelDecorator = {
  type: "VALIDITY_LABEL";
  valid_until: string;
};

export type Position = {
  start_index: number;
  length: number;
};

export type Style = {
  position: Position;
  color: string;
  style: string;
};

export type TitleStyleDecorator = {
  type: "TITLE_STYLE";
  styles: Style[];
};

export type MoreButtonDecorator = {
  type: "MORE_BUTTON";
  link: Link;
  images: string[];
  sellable_item_count: number;
};

export type Explanation = {
  short_explanation: string;
  long_explanation: string;
};

export type Replacement = {
  type: "REPLACEMENT";
  display_price: number;
  image_id: string;
  replacement_type: string;
  id: string;
  name: string;
  unit_quantity: string;
  unit_quantity_sub?: string;
  price: number;
  tags: any[];
  decorators: Decorator[];
  max_count: number;
};

export type UnavailableDecorator = {
  type: "UNAVAILABLE";
  reason: string;
  replacements?: Replacement[];
  deeplink: string;
  explanation: Explanation;
};

export type Characteristics = {
  baby_month: string | null;
  rating: string | null;
  score: string | null;
  type: "FROZEN";
};

export type ProductCharacteristicsDecorator = {
  type: "PRODUCT_CHARACTERISTICS";
  characteristics: Characteristics[];
};

export type FailureReason = "PRODUCT_ABSENT" | "PRODUCT_LOW_QUALITY" | "PRODUCT_NOT_SHIPPED";

export type ArticleDeliveryFailureDecorator = {
  type: "ARTICLE_DELIVERY_FAILURES";
  failures: { [x: string]: FailureReason[] };
  prices: { [x: string]: number };
};

export type ImmutableDecorator = {
  type: "IMMUTABLE";
};

export type BundlesButtonDecorator = {
  type: "BUNDLES_BUTTON";
  icon_color: string;
  deeplink: string;
  background_color: string;
};

export type Decorator =
  | BasePriceDecorator
  | FreshLabelDecorator
  | LabelDecorator
  | PriceDecorator
  | BackgroundImageDecorator
  | BannersDecorator
  | QuantityDecorator
  | UnitQuantityDecorator
  | ValidityLabelDecorator
  | TitleStyleDecorator
  | MoreButtonDecorator
  | UnavailableDecorator
  | ImmutableDecorator
  | ArticleDeliveryFailureDecorator
  | BundlesButtonDecorator
  | OrderedQuantityDecorator
  | ProductSizeDecorator
  | ProductCharacteristicsDecorator;
