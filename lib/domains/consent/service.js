"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentService = void 0;
class ConsentService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the list of consent settings.
     * @param {boolean} [general=false] If true, returns only the 'general' consent settings.
     */
    getConsentSettings(general = false) {
        return this.http.sendRequest("GET", `/consents${general ? "/general" : ""}/settings-page`);
    }
    /**
     * Sets one or multiple consent options.
     * @param {SetConsentSettingsInput} consentSettingsInput An object containing consent declarations.
     */
    setConsentSettings(consentSettingsInput) {
        return this.http.sendRequest("PUT", `/consents`, consentSettingsInput);
    }
    /**
     * Returns the list of consent requests, filtered by topic keys and strategy.
     * @param {ConsentTopic[]} consentTopics List of consent topic keys to filter by.
     * @param {ConsentTopicsStrategy} strategy Strategy to apply when fetching consents ("WIDE" or "NARROW").
     */
    getConsents(consentTopics, strategy) {
        const params = new URLSearchParams();
        consentTopics.forEach((t) => params.append("consent_topics", t));
        params.set("strategy", strategy);
        return this.http.sendRequest("GET", `/consents?${params.toString()}`);
    }
    /**
     * Returns the general consent request.
     */
    getGeneralConsents() {
        return this.http.sendRequest("GET", `/consents/general`);
    }
    /**
     * Updates the general consent declarations.
     * @param {SetGeneralConsentsInput} declarations The consent declarations to apply.
     */
    setGeneralConsents(declarations) {
        return this.http.sendRequest("PUT", `/consents/general`, declarations);
    }
}
exports.ConsentService = ConsentService;
//# sourceMappingURL=service.js.map