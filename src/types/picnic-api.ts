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

export type LoginInput = {
  key: string;
  secret: string;
  client_id: number;
};

export type Generate2FACodeInput = {
  channel: "SMS" | string;
};

export type Verify2FACodeInput = {
  otp: string;
};

export type LoginResult = {
  user_id: string;
  second_factor_authentication_required: boolean;
  show_second_factor_authentication_intro: boolean;
  authKey: string;
};

export type Address = {
  house_number: number;
  house_number_ext: string;
  postcode: string;
  street: string;
  city: string;
};

export type Subscription = {
  list_id: string;
  subscribed: boolean;
  name: string;
};

export type HouseholdDetails = {
  adults: number;
  children: number;
  cats: number;
  dogs: number;
  author: string;
  last_edit_ts: number;
};

export type ConsentDecisions = {
  MISC_COMMERCIAL_ADS: boolean;
  MISC_COMMERCIAL_EMAILS: boolean;
  MISC_COMMERCIAL_MESSAGES: boolean;
  MISC_READ_ADVERTISING_ID: boolean;
  MISC_WHATS_APP_COMMUNICATION: boolean;
  PERSONALIZED_RANKING_CONSENT: boolean;
  POST_MAIL: boolean;
  PURCHASES_CATEGORY_CONSENT: boolean;
  WEEKLY_COMMERCIAL_EMAILS: boolean;
};

export type FeatureToggle = {
  name: string;
};

export type User = {
  user_id: string;
  firstname: string;
  lastname: string;
  address: Address;
  phone: string;
  contact_email: string;
  feature_toggles: FeatureToggle[];
  push_subscriptions: Subscription[];
  subscriptions: Subscription[];
  customer_type: string | "CONSUMER";
  household_details: HouseholdDetails;
  check_general_consent: boolean;
  placed_order: boolean;
  received_delivery: boolean;
  total_deliveries: number;
  completed_deliveries: number;
  consent_decisions: ConsentDecisions;
};

export type UserInfo = {
  user_id: string;
  redacted_phone_number: string;
  feature_toggles: FeatureToggle[];
};

export type Avatar = {
  image_url: string;
  type: string;
};

export type ProfileUser = {
  address: Address;
  avatar: Avatar;
  mgm: MgmDetails;
};

export type ProfileMenu = {
  highlights: any[];
  user: ProfileUser;
};

export type BankInformation = {
  bank_id: string;
  name: string;
};

export type AvailablePaymentMethod = {
  available_banks?: BankInformation[];
  payment_method: string;
};

export type PaymentMethodBrand = {
  brand: string;
  display_name: string;
  icon_url: string;
};

export type PaymentMethod = {
  brands: PaymentMethodBrand[];
  data: object;
  display_name: string;
  icon_url: string;
  payment_method: string;
  visibility: string;
  visibility_reason: null | string;
};

export type StoredPaymentOption = {
  account: string | null;
  brand: string;
  display_name: string;
  icon_url: string;
  id: string;
  payment_method: string;
};

export type PaymentProfile = {
  available_payment_method_item: any | null;
  available_payment_methods: AvailablePaymentMethod[];
  checkout_banner: any | null;
  payment_methods: PaymentMethod[];
  preferred_payment_option_id: string;
  stored_payment_options: StoredPaymentOption[];
};

export type WalletTransactionsInput = {
  page_number: number;
};

export type WalletTransaction = {
  account: string;
  amount_in_cents: number;
  brand: string;
  display_name: string;
  icon_url: string;
  id: string;
  status: string;
  timestamp: number;
  transaction_method: string;
  transaction_type: string;
};

export type ReturnedContainer = {
  localized_name: string;
  price: number;
  quantity: number;
  type: string;
};

export type Deposit = {
  count: number;
  type: string;
  value: number;
};

export type WalletTransactionDetails = {
  article_issue_refunds: any[];
  debt_resolution: any | null;
  delivery_debt: any | null;
  delivery_id: string;
  deposits: Deposit[];
  refunded_items: any[];
  returned_containers: ReturnedContainer[];
  shop_items: OrderLine[];
};

export type OpeningTime = {
  start: number[]; // [23, 0]
  end: number[]; // [8, 0]
};

export type OpeningTimes = {
  [date: string]: OpeningTime;
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

export type Link = {
  type: string;
  href: string;
};

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
} & ArticleMixin;

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

export type SingleArticle = {
  type: "SINGLE_ARTICLE";
  display_price: number;
  image_id: string;
} & ArticleMixin;

export type SearchResult = {
  decorators: Decorator[];
  display_price: string;
  id: string;
  image_id: string;
  max_count: number;
  name: string;
  sole_article_id: string;
  unit_quantity: string;
};

export type SearchSuggestion = {
  type: "SEARCH_SUGGESTION";
  id: string;
  links: Link[];
  suggestion: string;
};

export type SuggestionResult = SearchSuggestion;

export type NutritionalSubValue = {
  name: string;
  value: string;
  gda_percentage: string;
};

export type NutritionalValue = {
  name: string;
  value: string;
  gda_percentage: string;
  sub_values: NutritionalSubValue[];
};

export type SubCategory = {
  type: "CATEGORY";
  id: string;
  decorators: Decorator[];
  links: Link[];
  name: string;
  items: Category[];
  level: number;
  is_included_in_category_tree: boolean;
  hidden: boolean;
};

export type Category = {
  type: "CATEGORY";
  id: string;
  decorators: Decorator[];
  links: Link[];
  name: string;
  items: SubCategory[];
  level: number;
  is_included_in_category_tree: boolean;
  hidden: boolean;
};

export type TemplatedContent = {
  type: "TEMPLATED_CONTENT";
  template_id: string;
  version_id: string;
  version_name: string;
  content: string;
  parameters: string[];
  actions: string[];
};

export type Content = {
  type: "CONTENT";
  id: string;
  display_position: string;
  payload: TemplatedContent;
};

export type DisplayPositionContent = {
  type: "DISPLAY_POSITION_CONTENTS";
  id: string;
  links: Link[];
  display_position: string;
  items: Content[];
};

export type MyStore = {
  type: "MY_STORE";
  catalog: Category[];
  content: DisplayPositionContent[];
  user: User;
  first_time_user: boolean;
  landing_page_hint: string;
  id: string;
  links: Link[];
};

export type ArticleMixin = {
  id: string;
  name: string;
  unit_quantity: string;
  unit_quantity_sub?: string;
  price: number;
  tags: any[];
  decorators: Decorator[];
  max_count: number;
};

export type OrderArticle = {
  type: "ORDER_ARTICLE";
  image_ids: string[];
  perishable: boolean;
} & ArticleMixin;

export type OrderLine = {
  type: "ORDER_LINE";
  id: string;
  items: OrderArticle[];
  display_price: number;
  price: number;
  decorators: Decorator[];
};

export type Source = {
  id: string;
};

export type ImageComponent = {
  type: string;
  source: Source;
  width: number;
  height: number;
  resize_mode: string;
};

export type IconImages = {
  "image-id": string;
};

export type TrackingAttributes = {
  template_variant_id: string;
  entity_ids: string[];
};

export type PML<Component> = {
  pml_version: string;
  component: Component;
  images?: IconImages;
  tracking_attributes: TrackingAttributes;
};

export type Icon = PML<ImageComponent>;

export type DeliverySlot = {
  slot_id: string;
  hub_id: string;
  fc_id: string;
  window_start: string;
  window_end: string;
  cut_off_time: string;
  is_available: boolean;
  selected: boolean;
  reserved: boolean;
  minimum_order_value: number;
  icon?: Icon;
  unavailability_reason: "CLOSED" | string;
};

export type SelectedSlot = {
  slot_id: string;
  state: string;
};

export type StackComponent = {
  type: "STACK";
  axis?: string;
  alignment: string;
  spacing: string;
  padding_vertical?: number;
  children?: Component[];
  child?: Component;
};

export type ContainerComponent = {
  type: "CONTAINER";
  border_width: number;
  border_radius: number;
  border_color: string;
  background_color: string;
  width: number;
  height: number;
  children?: Component[];
  child?: Component;
};

export type RichTextComponent = {
  type: "RICH_TEXT";
  text_type: string;
  text_alignment: string;
  markdown: string;
};

export type Component = StackComponent | ContainerComponent | ImageComponent | RichTextComponent;

export type SlotSelectorMessage = {
  pml_version: string;
  component: Component;
  images: { icon: string };
  tracking_attributes: TrackingAttributes;
};

export type DepositBreakdown = {
  type: "BAG" | "DEFAULT" | string;
  value: number;
  count: number;
};

export type Order = {
  type: "ORDER";
  id: string;
  items: OrderLine[];
  delivery_slots: DeliverySlot[];
  selected_slot: SelectedSlot;
  slot_selector_message: SlotSelectorMessage;
  total_count: number;
  total_price: number;
  checkout_total_price: number;
  mts: number;
  deposit_breakdown: DepositBreakdown[];
  total_savings: number;
  total_deposit: number;
  cancellable: boolean;
  creation_time: string;
  status: DeliveryStatus;
  decorator_overrides: { [key: string]: Decorator[] };
  cancellation_time: string | null;
};

export type AddProductInput = {
  product_id: string;
  count: number;
};

export type GetDeliverySlotsResult = {
  delivery_slots: DeliverySlot[];
  slot_selector_message: SlotSelectorMessage;
  selected_slot: SelectedSlot;
};

export type SetDeliverySlotInput = {
  slot_id: string;
};

export type DeliveryStatus = "CURRENT" | "COMPLETED" | "CANCELLED" | string;

export type DeliveryTime = {
  start: string;
  end: string;
};

export type ReturnContainer = {
  type: "BAG" | "BEER_BOTTLE" | "DISPOSABLE" | "NESPRESSO_BAG" | string;
  localized_name: string;
  quantity: number;
  price: number;
};

export type Delivery = {
  type: "DELIVERY";
  id: string;
  delivery_id: string;
  creation_time: string;
  slot: DeliverySlot;
  eta2: DeliveryTime;
  status: DeliveryStatus;
  delivery_time: DeliveryTime;
  orders: Order[];
  returned_containers: ReturnContainer[];
  parcels: any[];
};

export type Vehicle = {
  image: string;
};

export type Scenario = {
  ts: string;
  lng: string;
  lat: string;
};

export type DeliveryScenario = {
  scenario: Scenario[];
  vehicle: Vehicle;
};

export type DeliveryPosition = {
  scenario_ts: string;
};

export type OrderStatus = {
  checkout_status: "FINISHED" | string;
};

export type MgmDetails = {
  mgm_code: string;
  invitee_value: number;
  inviter_value: number;
  share_url: string;
  amount_earned: number;
};

export type ConsentSettingText = {
  title: string;
  text: string;
  dissent_text: string;
  timestamp: string;
};

export type ConsentSetting = {
  type: string;
  id: string;
  text_id: string;
  text_locale: string;
  text: ConsentSettingText;
  established_decision: boolean;
  initial_state: boolean;
};

export type ConsentDeclaration = {
  consent_request_text_id: string;
  consent_request_locale: string;
  agreement: boolean;
};

export type SetConsentSettingsInput = {
  consent_declarations: ConsentDeclaration[];
};

export type SetConsentSettingsResult = {
  consent_request_text_ids: string[];
};

export type NutritionalTable = {
  type: "NUTRITIONAL_TABLE";
  nutritional_table: {
    default_unit: string;
    values: NutritionalValue[];
  };
};

export type PriceInfo = {
  price: number;
  price_color: string | null;
  original_price: number | null;
  deposit: number | null;
  base_price_text: string | null;
};

export type Tagged<Type, Obj> = { type: Type } & Obj;

export type ArticleMiscHeader = {
  icon: string;
  text: string;
};

export type ArticleMiscBody = NutritionalTable | Tagged<"PML", { pml_content: PML<Component> }>;

export type ArticleMisc = {
  header: ArticleMiscHeader;
  body: ArticleMiscBody;
};

export type ArticleHighlight = {
  icon: string;
  text: string;
  action: any | null; // haven't seen this yet
};

export type AllergyContains = {
  name: string;
  color: string;
};

export type Allergies = {
  allergy_contains: AllergyContains[];
  allergy_may_contain: string[];
  allergy_text: string | null;
};

export type ArticleLabels = {
  brand_tier: any | null;
  status: any[];
  characteristics: any[];
  size: any | null;
  promo: { text: string } | null;
};

export type ArticleDescription = {
  main: string;
  extension: string | null;
};

export type Article = {
  type: "ARTICLE_DETAILS";
  id: string;
  name: string;
  description: ArticleDescription;
  images: { image_id: string }[];
  labels: ArticleLabels;
  price_info: PriceInfo;
  unit_quantity: string;
  max_order_quantity: number;
  category_link: string;
  allergies: Allergies;
  highlights: ArticleHighlight[];
  mood_gallery: (Tagged<"Image", { image_id: string }> | any)[];
  decorators?: Decorator[];
  misc: ArticleMisc[];
};
