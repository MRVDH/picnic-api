import type HttpClient from "../../http-client";
import {
  RawConsentRequest,
  RawConsentSetting,
  ConsentTopic,
  ConsentTopicsStrategy,
  SetConsentSettingsInput,
  RawSetConsentSettingsResult,
  SetGeneralConsentsInput,
} from "./types";

export class ConsentService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the consent settings.
   */
  getConsentSettings(): Promise<RawConsentSetting[]> {
    return this.http.sendRequest<null, RawConsentSetting[]>("GET", `/consents/settings-page`);
  }

  /**
   * Returns the general consent settings.
   */
  getGeneralConsentSettings(): Promise<RawConsentSetting[]> {
    return this.http.sendRequest<null, RawConsentSetting[]>("GET", `/consents/general/settings-page`);
  }

  /**
   * Sets one or multiple consent options.
   * @param {SetConsentSettingsInput} consentSettingsInput An object containing consent declarations.
   */
  setConsentSettings(consentSettingsInput: SetConsentSettingsInput): Promise<RawSetConsentSettingsResult> {
    return this.http.sendRequest<SetConsentSettingsInput, RawSetConsentSettingsResult>("PUT", `/consents`, consentSettingsInput);
  }

  /**
   * Returns the list of consent requests, filtered by topic keys and strategy.
   * @param {ConsentTopic[]} consentTopics List of consent topic keys to filter by.
   * @param {ConsentTopicsStrategy} strategy Strategy to apply when fetching consents ("WIDE" or "NARROW").
   */
  getConsents(consentTopics: ConsentTopic[], strategy: ConsentTopicsStrategy): Promise<RawConsentRequest[]> {
    const params = new URLSearchParams();
    consentTopics.forEach((t) => params.append("consent_topics", t));
    params.set("strategy", strategy);
    return this.http.sendRequest<null, RawConsentRequest[]>("GET", `/consents?${params.toString()}`);
  }

  /**
   * Returns the general consent request.
   */
  getGeneralConsents(): Promise<RawConsentRequest> {
    return this.http.sendRequest<null, RawConsentRequest>("GET", `/consents/general`);
  }

  /**
   * Updates the general consent declarations.
   * @param {SetGeneralConsentsInput} declarations The consent declarations to apply.
   */
  setGeneralConsents(declarations: SetGeneralConsentsInput): Promise<void> {
    return this.http.sendRequest<SetGeneralConsentsInput, void>("PUT", `/consents/general`, declarations);
  }
}
