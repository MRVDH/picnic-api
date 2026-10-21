import type HttpClient from "../../http-client";
import { CustomerServiceContactInfo } from "./types";

export class CustomerServiceService {
  constructor(private http: HttpClient) {}

  /**
   * Returns customer service contact details and opening times.
   */
  getContactInfo(): Promise<CustomerServiceContactInfo> {
    return this.http.sendRequest<any, CustomerServiceContactInfo>("GET", `/cs-contact-info`, null, { includePicnicHeaders: true });
  }

  /**
   * Returns CS contact info without requiring authentication.
   * Uses the public API endpoint (/public-api/...) with a picnic-country header.
   * @param {string} countryCode The country code to pass as the picnic-country header (e.g. 'NL').
   */
  getUnauthenticatedContactInfo(countryCode: string): Promise<CustomerServiceContactInfo> {
    const publicUrl = this.http.url.replace("/api/", "/public-api/");
    return this.http.sendRequest<null, CustomerServiceContactInfo>("GET", `${publicUrl}/cs-contact-info`, null, {
      authenticated: false,
      headers: { "picnic-country": countryCode },
    });
  }
}
