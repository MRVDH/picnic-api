import type HttpClient from "../../http-client";
import {
  ConsentRequest,
  ConsentSetting,
  ConsentTopic,
  ConsentTopicsStrategy,
  SetConsentSettingsInput,
  SetConsentSettingsResult,
  SetGeneralConsentsInput,
} from "./types";

export class ConsentService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the list of consent settings.
   * @param {boolean} [general=false] If true, returns only the 'general' consent settings.
   */
  getConsentSettings(general: boolean = false): Promise<ConsentSetting[]> {
    return this.http.sendRequest<any, ConsentSetting[]>("GET", `/consents${general ? "/general" : ""}/settings-page`);
  }

  /**
   * Sets one or multiple consent options.
   * @param {SetConsentSettingsInput} consentSettingsInput An object containing consent declarations.
   */
  setConsentSettings(consentSettingsInput: SetConsentSettingsInput): Promise<SetConsentSettingsResult> {
    return this.http.sendRequest<any, SetConsentSettingsResult>("PUT", `/consents`, consentSettingsInput);
  }

  /**
   * Returns the list of consent requests, filtered by topic keys and strategy.
   * @param {ConsentTopic[]} consentTopics List of consent topic keys to filter by.
   * @param {ConsentTopicsStrategy} strategy Strategy to apply when fetching consents ("WIDE" or "NARROW").
   */
  getConsents(consentTopics: ConsentTopic[], strategy: ConsentTopicsStrategy): Promise<ConsentRequest[]> {
    const params = new URLSearchParams();
    consentTopics.forEach((t) => params.append("consent_topics", t));
    params.set("strategy", strategy);
    return this.http.sendRequest<any, ConsentRequest[]>("GET", `/consents?${params.toString()}`);
  }

  /**
   * Returns the general consent request.
   */
  getGeneralConsents(): Promise<ConsentRequest> {
    return this.http.sendRequest<any, ConsentRequest>("GET", `/consents/general`);
  }

  /**
   * Updates the general consent declarations.
   * @param {SetGeneralConsentsInput} declarations The consent declarations to apply.
   */
  setGeneralConsents(declarations: SetGeneralConsentsInput): Promise<void> {
    return this.http.sendRequest<SetGeneralConsentsInput, void>("PUT", `/consents/general`, declarations);
  }
}
