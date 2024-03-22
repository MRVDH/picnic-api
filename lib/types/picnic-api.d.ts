export declare type ApiConfig = {
    countryCode?: CountryCode;
    apiVersion?: string;
    authKey?: string;
    url?: string;
};
export declare type CountryCode = "NL" | "DE";
export declare type ImageSize = "tiny" | "small" | "medium" | "large" | "extra-large";
export declare type LoginInput = {
    key: string;
    secret: string;
    client_id: number;
};
export declare type LoginResult = {
    user_id: string;
    second_factor_authentication_required: string;
    authKey: string;
};
export declare type Address = {
    house_number: number;
    house_number_ext: string;
    postcode: string;
    street: string;
    city: string;
};
export declare type Subscription = {
    list_id: string;
    subscribed: boolean;
    name: string;
};
export declare type HouseholdDetails = {
    adults: number;
    children: number;
    cats: number;
    dogs: number;
    author: string;
    last_edit_ts: number;
};
export declare type ConsentDecisions = {
    MISC_COMMERCIAL_ADS: boolean;
    PURCHASES_CATEGORY_CONSENT: boolean;
    MISC_COMMERCIAL_EMAILS: boolean;
    MISC_READ_ADVERTISING_ID: boolean;
    PERSONALIZED_RANKING_CONSENT: boolean;
    MISC_COMMERCIAL_MESSAGES: boolean;
    WEEKLY_COMMERCIAL_EMAILS: boolean;
};
export declare type User = {
    user_id: string;
    firstname: string;
    lastname: string;
    address: Address;
    phone: string;
    contact_email: string;
    feature_toggles: any[];
    push_subscriptions: Subscription[];
    subscriptions: Subscription[];
    customer_type: string;
    household_details: HouseholdDetails;
    check_general_consent: boolean;
    placed_order: boolean;
    received_delivery: boolean;
    total_deliveries: number;
    completed_deliveries: number;
    consent_decisions: ConsentDecisions;
};
export declare type Link = {
    type: string;
    href: string;
};
export declare type BasePriceDecorator = {
    type: "BASE_PRICE";
    base_price_text: string;
};
export declare type FreshLabelDecorator = {
    type: "FRESH_LABEL";
    period: string;
};
export declare type LabelDecorator = {
    type: "LABEL";
    text: string;
};
export declare type PriceDecorator = {
    type: "PRICE";
    display_price: number;
};
export declare type QuantityDecorator = {
    type: "QUANTITY";
    quantity: number;
};
export declare type BackgroundImageDecorator = {
    type: "BACKGROUND_IMAGE";
    image_ids: string[];
    height_percent: number;
};
export declare type DeeplinkReference = {
    type: "DEEPLINK";
    target: string;
};
export declare type SubBanner = {
    banner_id: string;
    image_id: string;
    display_time: string;
    description: string;
    reference: DeeplinkReference;
    position: string;
};
export declare type BannersDecorator = {
    type: "BANNERS";
    height_percentage: number;
    banners: SubBanner[];
};
export declare type UnitQuantityDecorator = {
    type: "UNIT_QUANTITY";
    unit_quantity_text: string;
};
export declare type ValidityLabelDecorator = {
    type: "VALIDITY_LABEL";
    valid_until: string;
};
export declare type Position = {
    start_index: number;
    length: number;
};
export declare type Style = {
    position: Position;
    color: string;
    style: string;
};
export declare type TitleStyleDecorator = {
    type: "TITLE_STYLE";
    styles: Style[];
};
export declare type MoreButtonDecorator = {
    type: "MORE_BUTTON";
    link: Link;
    images: string[];
    sellable_item_count: number;
};
export declare type Explanation = {
    short_explanation: string;
    long_explanation: string;
};
export declare type Replacement = {
    type: "REPLACEMENT";
    display_price: number;
    image_id: string;
    replacement_type: string;
} & ArticleMixin;
export declare type UnavailableDecorator = {
    type: "UNAVAILABLE";
    reason: string;
    replacements: Replacement[];
    explanation: Explanation;
};
export declare type FailureReason = "PRODUCT_ABSENT" | "PRODUCT_LOW_QUALITY" | "PRODUCT_NOT_SHIPPED";
export declare type ArticleDeliveryFailureDecorator = {
    type: "ARTICLE_DELIVERY_FAILURES";
    failures: {
        [x: string]: FailureReason[];
    };
    prices: {
        [x: string]: number;
    };
};
export declare type ImmutableDecorator = {
    type: "IMMUTABLE";
};
export declare type Decorator = BasePriceDecorator | FreshLabelDecorator | LabelDecorator | PriceDecorator | BackgroundImageDecorator | BannersDecorator | QuantityDecorator | UnitQuantityDecorator | ValidityLabelDecorator | TitleStyleDecorator | MoreButtonDecorator | UnavailableDecorator | ImmutableDecorator | ArticleDeliveryFailureDecorator;
export declare type SingleArticle = {
    type: "SINGLE_ARTICLE";
    display_price: number;
    image_id: string;
} & ArticleMixin;
export declare type ItemSuggestionCatalog = {
    type: "ITEM_SUGGESTION_DIALOG";
    id: string;
};
export declare type SearchResultItem = SingleArticle | ItemSuggestionCatalog;
export declare type SearchResult = {
    type: string;
    id: string;
    links: Link[];
    name: string;
    items: SearchResultItem[];
    level: number;
    is_included_in_category_tree: boolean;
    hidden: boolean;
};
export declare type SearchSuggestion = {
    type: "SEARCH_SUGGESTION";
    id: string;
    links: Link[];
    suggestion: string;
};
export declare type SuggestionResult = SearchSuggestion;
export declare type NutritionalSubValue = {
    name: string;
    value: string;
    gda_percentage: string;
};
export declare type NutritionalValue = {
    name: string;
    value: string;
    gda_percentage: string;
    sub_values: NutritionalSubValue[];
};
export declare type SubCategory = {
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
export declare type Category = {
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
export declare type TemplatedContent = {
    type: "TEMPLATED_CONTENT";
    template_id: string;
    version_id: string;
    version_name: string;
    content: string;
    parameters: string[];
    actions: string[];
};
export declare type Content = {
    type: "CONTENT";
    id: string;
    display_position: string;
    payload: TemplatedContent;
};
export declare type DisplayPositionContent = {
    type: "DISPLAY_POSITION_CONTENTS";
    id: string;
    links: Link[];
    display_position: string;
    items: Content[];
};
export declare type MyStore = {
    type: "MY_STORE";
    catalog: Category[];
    content: DisplayPositionContent[];
    user: User;
    first_time_user: boolean;
    landing_page_hint: string;
    id: string;
    links: Link[];
};
export declare type ArticleMixin = {
    id: string;
    name: string;
    unit_quantity: string;
    unit_quantity_sub?: string;
    price: number;
    tags: any[];
    decorators: Decorator[];
    max_count: number;
};
export declare type OrderArticle = {
    type: "ORDER_ARTICLE";
    image_ids: string[];
    perishable: boolean;
} & ArticleMixin;
export declare type OrderLine = {
    type: "ORDER_LINE";
    id: string;
    items: OrderArticle[];
    display_price: number;
    price: number;
    decorators: Decorator[];
};
export declare type Source = {
    id: string;
};
export declare type ImageComponent = {
    type: string;
    source: Source;
    width: number;
    height: number;
    resize_mode: string;
};
export declare type IconImages = {
    "image-id": string;
};
export declare type TrackingAttributes = {
    template_variant_id: string;
    entity_ids: string[];
};
export declare type PML<Component> = {
    pml_version: string;
    component: Component;
    images?: IconImages;
    tracking_attributes: TrackingAttributes;
};
export declare type Icon = PML<ImageComponent>;
export declare type DeliverySlot = {
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
export declare type SelectedSlot = {
    slot_id: string;
    state: string;
};
export declare type StackComponent = {
    type: "STACK";
    axis?: string;
    alignment: string;
    spacing: string;
    padding_vertical?: number;
    children?: Component[];
    child?: Component;
};
export declare type ContainerComponent = {
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
export declare type RichTextComponent = {
    type: "RICH_TEXT";
    text_type: string;
    text_alignment: string;
    markdown: string;
};
export declare type Component = StackComponent | ContainerComponent | ImageComponent | RichTextComponent;
export declare type SlotSelectorMessage = {
    pml_version: string;
    component: Component;
    images: {
        icon: string;
    };
    tracking_attributes: TrackingAttributes;
};
export declare type DepositBreakdown = {
    type: "BAG" | "DEFAULT" | string;
    value: number;
    count: number;
};
export declare type Order = {
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
    deposit_breakdown: (DepositBreakdown)[];
    total_savings: number;
    total_deposit: number;
    cancellable: boolean;
    creation_time: string;
    status: DeliveryStatus;
    decorator_overrides: {
        [key: string]: Decorator[];
    };
    cancellation_time: string | null;
};
export declare type AddProductInput = {
    product_id: string;
    count: number;
};
export declare type GetDeliverySlotsResult = {
    delivery_slots: DeliverySlot[];
    slot_selector_message: SlotSelectorMessage;
    selected_slot: SelectedSlot;
};
export declare type SetDeliverySlotInput = {
    slot_id: string;
};
export declare type DeliveryStatus = "CURRENT" | "COMPLETED" | "CANCELLED" | string;
export declare type DeliveryTime = {
    start: string;
    end: string;
};
export declare type ReturnContainer = {
    type: "BAG" | "BEER_BOTTLE" | "DISPOSABLE" | "NESPRESSO_BAG" | string;
    localized_name: string;
    quantity: number;
    price: number;
};
export declare type Delivery = {
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
export declare type Vehicle = {
    image: string;
};
export declare type Scenario = {
    ts: string;
    lng: string;
    lat: string;
};
export declare type DeliveryScenario = {
    scenario: Scenario[];
    vehicle: Vehicle;
};
export declare type DeliveryPosition = {
    scenario_ts: string;
};
export declare type OrderStatus = {
    checkout_status: "FINISHED" | string;
};
export declare type MgmDetails = {
    mgm_code: string;
    invitee_value: number;
    inviter_value: number;
    share_url: string;
    amount_earned: number;
};
export declare type ConsentSettingText = {
    title: string;
    text: string;
    dissent_text: string;
    timestamp: string;
};
export declare type ConsentSetting = {
    type: string;
    id: string;
    text_id: string;
    text_locale: string;
    text: ConsentSettingText;
    established_decision: boolean;
    initial_state: boolean;
};
export declare type ConsentDeclaration = {
    consent_request_text_id: string;
    consent_request_locale: string;
    agreement: boolean;
};
export declare type SetConsentSettingsInput = {
    consent_declarations: ConsentDeclaration[];
};
export declare type SetConsentSettingsResult = {
    consent_request_text_ids: string[];
};
export declare type NutritionalTable = {
    type: "NUTRITIONAL_TABLE";
    nutritional_table: {
        default_unit: string;
        values: NutritionalValue[];
    };
};
export declare type PriceInfo = {
    price: number;
    price_color: string | null;
    original_price: number | null;
    deposit: number | null;
    base_price_text: string | null;
};
export declare type Tagged<Type, Obj> = {
    type: Type;
} & Obj;
export declare type ArticleMiscHeader = {
    icon: string;
    text: string;
};
export declare type ArticleMiscBody = NutritionalTable | Tagged<"PML", {
    pml_content: PML<Component>;
}>;
export declare type ArticleMisc = {
    header: ArticleMiscHeader;
    body: ArticleMiscBody;
};
export declare type ArticleHighlight = {
    icon: string;
    text: string;
    action: any | null;
};
export declare type AllergyContains = {
    name: string;
    color: string;
};
export declare type Allergies = {
    allergy_contains: AllergyContains[];
    allergy_may_contain: string[];
    allergy_text: string | null;
};
export declare type ArticleLabels = {
    brand_tier: any | null;
    status: any[];
    characteristics: any[];
    size: any | null;
    promo: {
        text: string;
    } | null;
};
export declare type ArticleDescription = {
    main: string;
    extension: string | null;
};
export declare type Article = {
    type: "ARTICLE_DETAILS";
    id: string;
    name: string;
    description: ArticleDescription;
    images: {
        image_id: string;
    }[];
    labels: ArticleLabels;
    price_info: PriceInfo;
    unit_quantity: string;
    max_order_quantity: number;
    category_link: string;
    allergies: Allergies;
    highlights: ArticleHighlight[];
    mood_gallery: (Tagged<"Image", {
        image_id: string;
    }> | any)[];
    decorators?: Decorator[];
    misc: ArticleMisc[];
};
//# sourceMappingURL=picnic-api.d.ts.map