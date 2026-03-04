export type ConsentSettingText = {
    title: string;
    text: string;
    dissent_text?: string;
    timestamp: string;
};
export type ConsentSetting = {
    type: ConsentType;
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
export type ConsentFormattedContent = {
    "text/html"?: string;
    "text/plain"?: string;
    dialog_flow?: string;
};
export type ConsentRequest = {
    type: ConsentType;
    id: string;
    text_id: string;
    text_locale: string;
    formatted_content?: ConsentFormattedContent;
    timestamp?: string;
};
export type ConsentType = "CONSENT_REQUEST" | "CONSENT_SETTING" | "CONSENT_PUSH";
export type ConsentTopicsStrategy = "WIDE" | "NARROW";
export type ConsentTopic = "MISC_COMMERCIAL_ADS" | "MISC_READ_ADVERTISING_ID" | (string & {});
export type SetGeneralConsentsInput = {
    consent_declarations: ConsentDeclaration[];
    general_consent: boolean;
};
//# sourceMappingURL=types.d.ts.map