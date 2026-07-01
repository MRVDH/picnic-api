export type BusinessDetails = {
    business_name?: string;
    business_registration_number?: string;
    sector?: string;
    employee_count?: number;
};
export type MgmDetails = {
    mgm_code: string;
    invitee_value: number;
    inviter_value: number;
    share_url: string;
    amount_earned: number;
};
export type Address = {
    id?: string;
    house_number: number;
    house_number_ext?: string;
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
    MISC_COMMERCIAL_ADS?: boolean;
    MISC_COMMERCIAL_EMAILS?: boolean;
    MISC_COMMERCIAL_MESSAGES?: boolean;
    MISC_READ_ADVERTISING_ID?: boolean;
    MISC_WHATS_APP_COMMUNICATION?: boolean;
    PERSONALIZED_PROMOTIONS?: boolean;
    PERSONALIZED_RANKING_CONSENT?: boolean;
    POST_MAIL?: boolean;
    PURCHASES_CATEGORY_CONSENT?: boolean;
    WEEKLY_COMMERCIAL_EMAILS?: boolean;
    [key: string]: boolean | undefined;
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
    customer_type: "CONSUMER" | "BUSINESS" | string;
    household_details: HouseholdDetails;
    business_details?: BusinessDetails;
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
export type UpdateCheckInput = {
    device_id: string;
    device_name: string;
    client_id: string;
    version: string;
    device_os: string;
    build_number: string;
};
export type UpdateCheckResult = {
    update_required: boolean;
    address_autocomplete_enabled_countries: string[];
    use_address_autocomplete_flow: boolean;
};
export type Avatar = {
    image_url: string;
    type: string;
};
export type ProfileUser = {
    name: string;
    address: Address;
    avatar: Avatar;
    mgm: MgmDetails;
};
export type ProfileMenu = {
    highlights: any[];
    user: ProfileUser;
};
//# sourceMappingURL=types.d.ts.map