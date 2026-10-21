import type HttpClient from "../../http-client";
import { RawContactInfo } from "./types";

export class CustomerServiceService {
  constructor(private http: HttpClient) {}

  /**
   * Returns customer service contact details and opening times.
   */
  getContactInfo(): Promise<RawContactInfo> {
    return this.http.sendRequest<null, RawContactInfo>("GET", `/cs-contact-info`, null, { includePicnicHeaders: true });
  }

  /**
   * Returns CS contact info without requiring authentication.
   * Uses the public API endpoint (/public-api/...) with a picnic-country header.
   * @param {string} countryCode The country code to pass as the picnic-country header (e.g. 'NL').
   */
  getUnauthenticatedContactInfo(countryCode: string): Promise<RawContactInfo> {
    const publicUrl = this.http.url.replace("/api/", "/public-api/");
    return this.http.sendRequest<null, RawContactInfo>("GET", `${publicUrl}/cs-contact-info`, null, {
      authenticated: false,
      headers: { "picnic-country": countryCode },
    });
  }
}
