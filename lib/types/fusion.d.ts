/**
 * Shared PML (Picnic Markup Language) component types.
 *
 * These types describe the building blocks of the Fusion page renderer:
 * the generic UI primitives that appear inside `pml.component` across all
 * pages and domains (app pages, cart decorators, catalog promotions, etc.).
 *
 * App-specific composite components (TOUCHABLE, STEPPER, SELLING_UNIT_TILE,
 * etc.) are defined further below and use the `Fusion` naming prefix.
 */
export type Padding = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};
export type TextAttributes = {
    size?: number;
    weight?: string;
    color?: string;
};
export type ImageSource = {
    id: string;
};
export type TrackingAttributes = {
    template_variant_id: string;
    entity_ids: string[];
};
export type ImageComponent = {
    type: "IMAGE";
    source: ImageSource;
    width: string | number;
    height: string | number;
    resizeMode?: string;
    derivativeType?: string;
    extension?: string;
    placeholder?: string | Record<string, any>;
    fallbackSource?: ImageSource;
    maxUpscalePercentage?: number;
    analytics?: Record<string, any>;
    aspectRatio?: number;
};
export type StackComponent = {
    type: "STACK";
    axis?: string;
    alignment?: string;
    distribution?: string;
    spacing?: number;
    padding?: Padding;
    width?: string | number;
    height?: string | number;
    backgroundColor?: string;
    wrap?: string;
    alignContent?: string;
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityActions?: any[];
    isHidden?: boolean;
    children?: Component[];
};
export type ContainerComponent = {
    type: "CONTAINER";
    width?: string | number;
    height?: string | number;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    overflow?: string;
    padding?: Padding;
    aspectRatio?: number;
    opacity?: number;
    accessible?: boolean;
    accessibilityLabel?: string;
    hideFromAccessibility?: boolean;
    pointerEvents?: string;
    absolutePosition?: Padding;
    accessibilityActions?: any[];
    /** Drop-shadow configuration (color, offset, opacity, radius). */
    shadow?: Record<string, any>;
    /** Component rendered as a blur underlay (product-details sticky header). */
    blurComponent?: any;
    /** Props passed to the blur underlay renderer. */
    blurProps?: Record<string, any>;
    child?: Component;
    children?: Component[];
};
export type RichTextComponent = {
    type: "RICH_TEXT";
    markdown: string;
    textType?: string;
    textAlignment?: string;
    textAttributes?: TextAttributes;
    numberOfLines?: number;
    flexShrink?: number;
    children?: Component[];
};
export type IconComponent = {
    type: "ICON";
    iconKey: string | Record<string, any>;
    width: number;
    height: number;
    color?: string | Record<string, any>;
    aspectRatio?: number;
    fallback?: Record<string, any>;
    /** Clockwise rotation in degrees applied to the icon (e.g. 270 for a chevron pointing up). */
    rotation?: number;
};
/** Union of the five core PML UI primitives. */
export type Component = StackComponent | ContainerComponent | ImageComponent | RichTextComponent | IconComponent;
export type PML<TComponent> = {
    pml_version: string;
    component: TComponent;
    images?: Record<string, string>;
    tracking_attributes?: TrackingAttributes;
};
/** A PML document whose root component is a single image — used for icons in the cart. */
export type Icon = PML<ImageComponent>;
export type TabType = "PAGE" | "CART" | "LEGACY_SEARCH" | "SEARCH" | "UNSUPPORTED" | string;
export type TabDecoratorType = "GIFT" | "NOTIFICATION" | "PRICE_BALLOON" | "NOTIFY_TAP" | "UNSUPPORTED" | string;
export type TabTargetType = "PICNIC_PAGE_REFERENCE" | "DEEPLINK" | "UNSUPPORTED" | string;
export type TabIconType = "PRESET" | "BASE_64" | "UNSUPPORTED" | string;
export type DynamicIconConfigType = "CART_VALUE" | "UNSUPPORTED" | string;
export type PresetIcon = "BASKET" | "BASKET_2" | "ACTIVE_PROMO" | "CHECKMARK" | "EPV" | "EPV_2" | "HEART" | "POT" | "PROFILE" | "PROMO" | "ROCKET" | "ROCKET_2" | "SEARCH" | "SEARCH_2" | "STOREFRONT" | "STOREFRONT_2" | "TROLLEY" | "TROLLEY_2" | "UNSUPPORTED" | string;
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
/** Controls a visual badge/decorator rendered on top of a tab icon. */
export type TabDecorator = {
    type: TabDecoratorType;
    /** Display positions that trigger this decorator's notification dot. */
    display_positions_to_notify?: string[] | null;
};
export type TabAccessibility = {
    label: string;
    hint: string;
};
/** Defines which display positions this tab renders messages for. */
export type MessageBehaviour = {
    display_positions_to_render: string[];
};
/** Global message polling configuration; defines which positions are polled. */
export type GeneralMessageBehaviour = {
    display_positions_to_poll: string[];
};
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
/** Braze SDK initialisation token. */
export type BrazeConfig = {
    authentication_token: string;
};
/** Datadog RUM / APM configuration. */
export type DatadogConfig = {
    rum_session_sample_rate: number;
    apm_trace_sample_rate: number;
};
/** Timeout for the pre-checkout upsell check before the cart proceeds. */
export type CartPreCheckoutUpsellConfig = {
    timeout_ms: number | null;
};
export type InAppFeatureConfig = {
    cart_pre_checkout_upsell_check?: CartPreCheckoutUpsellConfig | null;
};
/** The root response returned by `GET /bootstrap`. */
export type BootstrapData = {
    landing_tab_id: string;
    tabs: BootstrapTab[];
    general_message_behaviour: GeneralMessageBehaviour;
    datadog_config: DatadogConfig | null;
    braze_config: BrazeConfig | null;
    in_app_feature_config: InAppFeatureConfig | null;
    first_time_user: boolean;
};
export type FusionSpacing = {
    mainAxis?: number;
    crossAxis?: number;
};
export type FusionSize = {
    crossAxis?: string | number;
    mainAxis?: string | number;
};
export type FusionHitSlop = {
    horizontal?: number;
    vertical?: number;
};
export type FusionAnalyticsContext = {
    data: Record<string, any>;
    schema: string;
};
export type FusionItemAnalytics = {
    contexts: FusionAnalyticsContext[];
};
export type FusionOpenAction = {
    actionType: "OPEN";
    target: string;
};
/**
 * Payloads carried inside a `FusionEventAction`. These are not rendered
 * components — they are event descriptions evaluated by the runtime.
 */
export type FusionToastEventPayload = {
    type: "TOAST";
    /** Message text displayed in the native toast. */
    message?: string;
};
export type FusionSnackbarEventPayload = {
    type: "SNACKBAR";
    isVisible?: boolean;
    message?: string;
};
export type FusionRefreshEventPayload = {
    type: "REFRESH";
    /** Which layer to refresh, e.g. `"BACKGROUND_PAGES"`. */
    source?: string;
    onNext?: FusionPressAction;
};
/** Union of all typed event payloads that can appear as `FusionEventAction.action`. */
export type FusionEventPayload = FusionToastEventPayload | FusionSnackbarEventPayload | FusionRefreshEventPayload | {
    type: string;
    [key: string]: any;
};
export type FusionEventAction = {
    actionType: "EVENT";
    /** Event payload; typed via {@link FusionEventPayload} (not a rendered component). */
    action?: FusionEventPayload;
};
export type FusionEndpointAction = {
    actionType: "ENDPOINT";
    method: string;
    url: string;
    body?: Record<string, any>;
    onSuccess?: FusionPressAction;
};
export type FusionCallbackAction = {
    actionType: "CALLBACK";
    callback?: () => void;
};
/**
 * Instructs the runtime to reload a specific SUSPENSE boundary by its `suspenseId`.
 * Commonly used in error-state retry buttons.
 */
export type FusionReloadAction = {
    actionType: "RELOAD";
    suspenseId?: string;
};
/**
 * Fires a Snowplow analytics event, optionally chaining a follow-up action.
 * Seen on the delivery-receipt page (e.g. "add all to cart" button).
 */
export type FusionAnalyticsAction = {
    actionType: "ANALYTICS";
    context?: FusionAnalyticsContext | null;
    additionalContexts?: FusionAnalyticsContext[];
    onNext?: FusionPressAction;
};
export type FusionPressAction = FusionOpenAction | FusionEventAction | FusionEndpointAction | FusionCallbackAction | FusionReloadAction | FusionAnalyticsAction | {
    actionType: string;
    [key: string]: any;
};
export type FusionTouchableComponent = {
    type: "TOUCHABLE";
    onPress?: FusionPressAction;
    child?: FusionComponent;
    /** Can be a plain string or an EXPRESSION component whose result is the label. */
    accessibilityLabel?: string | FusionExpressionComponent | null;
    /** Can be a plain string or an EXPRESSION component whose result is the hint. */
    accessibilityHint?: string | FusionExpressionComponent | null;
    accessible?: boolean;
    hideFromAccessibility?: boolean;
    isHidden?: boolean;
    hitSlop?: FusionHitSlop;
    activeOpacity?: number;
    activeScale?: number;
    activeColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    disabled?: boolean;
    testID?: string;
};
export type FusionTimingAnimation = {
    type: "TIMING";
    duration: number;
    toValue: number;
};
export type FusionAnimationPresets = Record<string, Record<string, FusionTimingAnimation>>;
export type FusionAnimationContainerComponent = {
    type: "ANIMATION_CONTAINER";
    id: string;
    child: FusionComponent;
    presets: FusionAnimationPresets;
    /** Name of the preset to activate immediately on render. */
    selectedPreset?: string | null;
};
export type FusionReferenceContainerComponent = {
    type: "REFERENCE_CONTAINER";
    id: string;
    child: FusionComponent;
};
export type FusionExpressionComponent = {
    type: "EXPRESSION";
    name: string;
    expression: string;
};
export type SellingUnit = {
    id: string;
    name: string;
    image_id: string;
    display_price: number;
    unit_quantity: string;
    max_count: number;
    decorators: any[];
    price_ranges: any[] | null;
};
export type SellingUnitImageConfiguration = {
    derivativeType: string;
    extension: string;
    id: string;
};
export type FusionSellingUnitTileComponent = {
    type: "SELLING_UNIT_TILE";
    sellingUnit?: SellingUnit;
    sellingUnitImageConfiguration?: SellingUnitImageConfiguration;
    /** When true the tile does not contribute an analytics context to its parent. */
    excludeFromAnalyticsContext?: boolean;
};
export type FusionSellingUnitMutationComponent = {
    type: "SELLING_UNIT_MUTATION";
    mutation: "ADD" | "REMOVE" | string;
    quantity: number;
    sellingUnitId: string;
};
export type FusionStepperComponent = {
    type: "STEPPER";
    sellingUnitId: string;
    color: string;
    onIncrementPress?: FusionPressAction | null;
    onDecrementPress?: FusionPressAction | null;
    /** Fired when the collapsed stepper is tapped to expand. */
    onExpand?: FusionPressAction | null;
    /** Fired when the expanded stepper collapses back. */
    onCollapse?: FusionPressAction | null;
    presentation?: string;
    showCollapsed: boolean;
    showCollapsedRemoveButton: boolean;
    borderRadius?: number | null;
    textType?: string | null;
    /** Fixed height override for the stepper widget. */
    height?: number | null;
};
export type FusionAccessibilityAction = {
    name: string;
    onAction: FusionPressAction;
};
export type FusionAccessibilityInfo = {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: string;
    accessibilityActions?: FusionAccessibilityAction[];
};
export type FusionAccessibilityContainerComponent = {
    type: "ACCESSIBILITY_CONTAINER";
    sellingUnitId: string;
    contentType: string;
    availableAccessibility: FusionAccessibilityInfo;
    unavailableAccessibility: FusionAccessibilityInfo;
};
export type FusionUnavailabilityContainerComponent = {
    type: "UNAVAILABILITY_CONTAINER";
    sellingUnitId: string;
    /** Additional selling-unit IDs that share the same unavailability state (e.g. product-detail variants). */
    sellingUnitIds?: string[] | null;
    color: string;
    secondaryColor?: string;
    presentationStyle: string;
    /** When true, unavailability events are not tracked in analytics. */
    disableTrackingAnalytics?: boolean;
};
/** Native activity indicator / spinner; children are typically empty. */
export type FusionActivityIndicatorComponent = {
    type: "ACTIVITY_INDICATOR";
    children?: FusionComponent[];
};
/**
 * A modal overlay component. `isVisible` and `onDismiss` are usually
 * EXPRESSION components whose evaluated result drives visibility/dismiss.
 */
export type FusionModalComponent = {
    type: "MODAL";
    child: FusionComponent;
    isVisible: FusionExpressionComponent | boolean;
    onDismiss?: FusionExpressionComponent | null;
};
/** A simple themed button with a text label. */
export type FusionTextButtonComponent = {
    type: "TEXT_BUTTON";
    title: string;
    /** Preset style variant, e.g. `"PRIMARY"`. */
    style?: string;
    onPress?: FusionPressAction;
};
/** A single collapsible item inside an ACCORDION component. */
export type FusionAccordionItem = {
    header: FusionComponent;
    body: FusionComponent;
};
/**
 * A vertically stacked list of collapsible sections with header/body pairs.
 * Seen on the product-details page (e.g. ingredients & nutritional values)
 * and on the delivery-receipt page.
 */
export type FusionAccordionComponent = {
    type: "ACCORDION";
    items: FusionAccordionItem[];
    /** Non-item children rendered outside the accordion items. */
    children?: FusionComponent[];
    /** Separator component rendered between items. */
    separator?: FusionComponent | null;
    /** Icon shown when an item is collapsed. */
    iconCollapsed?: FusionComponent | null;
    /** Icon shown when an item is expanded. */
    iconExpanded?: FusionComponent | null;
    /** When true, no separator is rendered after the last item. */
    isLastSeparatorOmitted?: boolean;
    /** Action/expression fired when an item is expanded; `null` means no side-effect. */
    onAccordionItemExpanded?: FusionPressAction | FusionExpressionComponent | null;
    /** Action/expression fired when an item collapses. */
    onAccordionItemCollapsed?: FusionPressAction | FusionExpressionComponent | null;
};
/**
 * A formatted price display component (product-details and delivery-receipt pages).
 * `price` is an integer in the minor currency unit (e.g. cents).
 */
export type FusionPriceComponent = {
    type: "PRICE";
    price: number;
    color?: string;
    fontSize?: number;
    /** When true, the price is rendered with a strikethrough (crossed-out). */
    isCrossed?: boolean;
    opacity?: number;
    /** Optional prefix/suffix sign string, e.g. `"+"` or `null`. */
    priceSign?: string | null;
    testID?: string;
};
/** Triggers the native share sheet with a pre-composed message. */
export type FusionSocialShareComponent = {
    type: "SOCIAL_SHARE";
    message?: string;
};
/**
 * Metadata attached to a search result entity. Carries ranking and
 * retrieval-method information for analytics purposes.
 */
export type FusionSearchResultEntityComponent = {
    type: "SEARCH_RESULT_ENTITY";
    initial_dvs_rank?: number | null;
    retrieval_methods?: string[];
};
/**
 * Union of all PML inner component types found across all page responses.
 * The `type` discriminant field identifies each variant.
 */
export type FusionComponent = StackComponent | ContainerComponent | RichTextComponent | ImageComponent | IconComponent | FusionTouchableComponent | FusionAnimationContainerComponent | FusionReferenceContainerComponent | FusionExpressionComponent | FusionSellingUnitTileComponent | FusionSellingUnitMutationComponent | FusionStepperComponent | FusionAccessibilityContainerComponent | FusionUnavailabilityContainerComponent | FusionActivityIndicatorComponent | FusionModalComponent | FusionTextButtonComponent | FusionAccordionComponent | FusionPriceComponent | FusionSocialShareComponent | FusionSearchResultEntityComponent;
/** PML root object embedded inside a PML wrapper block. */
export type FusionPMLRoot = {
    pml_version: string;
    component: FusionComponent;
    images: Record<string, string>;
};
export type FlowLayout = {
    type: "FLOW";
    axis: string;
    spacing?: FusionSpacing;
    padding?: Padding;
    showsScrollIndicator?: boolean;
    backgroundColor?: string;
    cornerRadius?: Record<string, number>;
    overflow?: string;
    overScrollMode?: string;
    hideFromAccessibility?: boolean;
    accessibilityElementsHidden?: boolean;
    /** Pagination configuration. */
    pagination?: Record<string, any> | null;
    /**
     * ID of the item to scroll into focus on render. Can be a plain string or an
     * EXPRESSION component that resolves to the ID at runtime.
     */
    focusedItemId?: string | FusionExpressionComponent | null;
    focusedItemOffset?: number | null;
    itemVisibilityPercentage?: number | null;
    smoothScrollToFocusedItem?: boolean;
    viewabilityListeners?: any[] | null;
    /**
     * Override for the underlying list renderer.
     * Known values: `"FlashList"` (high-performance list on category pages).
     */
    listComponent?: string | null;
};
/** A PML item rendered inside the page block layout. */
export type PMLItem = {
    type: "PML";
    id: string;
    analytics: FusionItemAnalytics;
    size: FusionSize;
    pml: FusionPMLRoot;
    content?: Record<string, any>;
    viewComponentType?: string;
    /** When true the item is invisible but still present in the tree. */
    isHidden?: boolean;
};
/** A layout block that can contain nested blocks or PML items. */
export type BlockComponent = {
    type: "BLOCK";
    id: string;
    layout: FlowLayout;
    size: FusionSize;
    children: Array<BlockComponent | PMLItem | SuspenseComponent>;
    /** Block-level analytics payload, present on some blocks (e.g. recipe tiles). */
    analytics?: FusionItemAnalytics | null;
    /**
     * Expressions evaluated when the block mounts. Can be an array of named
     * expressions or a single EXPRESSION object (search pages use the latter).
     */
    initializeExpressions?: any[] | Record<string, any> | null;
    /** Action fired when the block mounts. */
    onMount?: FusionPressAction | null;
    /** Action fired when the block unmounts (navigation away). */
    onUnmount?: FusionPressAction | null;
    /** Action fired when the page containing this block regains focus. */
    onPageFocus?: FusionPressAction | null;
    /** Hides the block without removing it from the tree. */
    isHidden?: boolean | null;
};
/** Config for the loading or error state rendered by a suspense boundary. */
export type SuspenseFallbackConfig = {
    /** The PML item to render while loading / on error. */
    component: PMLItem;
    /** Presentation style, e.g. `"DEFAULT"`. */
    presentation?: string;
};
/** Async boundary used by some pages; wraps lazily-loaded content. */
export type SuspenseComponent = {
    type: "SUSPENSE";
    id?: string;
    /** Stable ID used by RELOAD actions to target this specific boundary. */
    suspenseId?: string;
    child?: BlockComponent | StateBoundaryComponent;
    /** References the page-content endpoint to fetch lazily. */
    pageConfig?: {
        id: string;
        parameters?: Record<string, any>;
    } | null;
    /** Shown while the lazy content is loading; `null` means no loading UI. */
    loadingConfig?: SuspenseFallbackConfig | null;
    /** Shown when the lazy content fetch fails; `null` means no error UI. */
    errorConfig?: SuspenseFallbackConfig | null;
};
export type StateBoundaryComponent = {
    type: "STATE_BOUNDARY";
    id: string;
    state: Record<string, any>;
    child: BlockComponent | SuspenseComponent;
};
export type FullScreenPresentation = {
    type: "FULL_SCREEN";
    style: {
        backgroundColor: string;
        /** Controls safe-area edge insets; value is `"off"` to disable a side (e.g. `{ bottom: "off" }`). */
        safeAreaEdges?: Record<string, string>;
    };
};
export type PageAnalytics = {
    /** Present on home pages; absent on some pages (e.g. meals, slot-selector) that only carry `contexts`. */
    type?: "Page" | string;
    additionalProperties?: Record<string, any>;
    contexts?: FusionAnalyticsContext[];
    domain?: string;
    name?: string;
    version?: string;
};
export type PageHeader = {
    type: string;
    title?: string | null;
    padding?: Padding;
    buttons?: any[] | null;
};
/** Minimal static header — just a title, no buttons or padding (e.g. category pages). */
export type StaticPageHeader = {
    type: "STATIC";
    title: string;
};
/** Standard header with an optional title, buttons and padding (e.g. slot-selector, delivery-receipt). */
export type DefaultPageHeader = {
    type: "DEFAULT";
    title?: string | null;
    padding?: Padding;
    buttons?: any[] | null;
};
/**
 * Generic page response returned by `GET /pages/:page-id`.
 * The same shape is shared across all page routes (home, purchases, slot selector, etc.).
 */
export type FusionPage = {
    id: string;
    /** Present on most pages, but may be absent on some routes. */
    analytics?: PageAnalytics | null;
    presentation: FullScreenPresentation;
    /** `null` for pages with no header bar; otherwise a typed header config. */
    header: StaticPageHeader | DefaultPageHeader | PageHeader | null;
    body: StateBoundaryComponent;
};
/** @deprecated Renamed to {@link FusionPage}. */
export type HomePage = FusionPage;
//# sourceMappingURL=fusion.d.ts.map