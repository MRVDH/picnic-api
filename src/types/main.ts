export type ApiConfig = {
    countryCode?: CountryCode;
    apiVersion?: string;
    authKey?: string;
    url?: string;
};

export type CountryCode = "NL" | "DE";

export type ImageSize = "tiny" | "small" | "medium" | "large" | "extra-large";