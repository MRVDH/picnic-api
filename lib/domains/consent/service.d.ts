import type HttpClient from "../../http-client";
import { ConsentRequest, ConsentSetting, ConsentTopic, ConsentTopicsStrategy, SetConsentSettingsInput, SetConsentSettingsResult, SetGeneralConsentsInput } from "./types";
export declare class ConsentService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the list of consent settings.
     * @param {boolean} [general=false] If true, returns only the 'general' consent settings.
     */
    getConsentSettings(general?: boolean): Promise<ConsentSetting[]>;
    /**
     * Sets one or multiple consent options.
     * @param {SetConsentSettingsInput} consentSettingsInput An object containing consent declarations.
     */
    setConsentSettings(consentSettingsInput: SetConsentSettingsInput): Promise<SetConsentSettingsResult>;
    /**
     * Returns the list of consent requests, filtered by topic keys and strategy.
     * @param {ConsentTopic[]} consentTopics List of consent topic keys to filter by.
     * @param {ConsentTopicsStrategy} strategy Strategy to apply when fetching consents ("WIDE" or "NARROW").
     */
    getConsents(consentTopics: ConsentTopic[], strategy: ConsentTopicsStrategy): Promise<ConsentRequest[]>;
    /**
     * Returns the general consent request.
     */
    getGeneralConsents(): Promise<ConsentRequest>;
    /**
     * Updates the general consent declarations.
     * @param {SetGeneralConsentsInput} declarations The consent declarations to apply.
     */
    setGeneralConsents(declarations: SetGeneralConsentsInput): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map