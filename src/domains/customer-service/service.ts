import type HttpClient from "../../http-client";
import { CustomerServiceContactInfo, MessagesWrapper, MessageDisplayPosition, RemindersWrapper, Reminder, Parcel } from "./types";

export class CustomerServiceService {
  constructor(private http: HttpClient) {}

  /**
   * Returns customer service contact details and opening times.
   */
  getContactInfo(): Promise<CustomerServiceContactInfo> {
    return this.http.sendRequest<any, CustomerServiceContactInfo>("GET", `/cs-contact-info`, null, true);
  }

  /**
   * Returns popup messages in the app (e.g. post-delivery satisfaction prompts,
   * message bar notifications, order-confirmation cards).
   * @param {MessageDisplayPosition[]} [displayPositions] Optional filter by display position(s).
   */
  getMessages(displayPositions?: MessageDisplayPosition[]): Promise<MessagesWrapper> {
    const query = displayPositions?.length ? `?${displayPositions.map((p) => `display_position=${encodeURIComponent(p)}`).join("&")}` : "";
    return this.http.sendRequest<any, MessagesWrapper>("GET", `/messages${query}`, null, true);
  }

  /**
   * Returns the user's configured delivery reminders.
   * Note: Reminders don't seem to be working yet.
   */
  getReminders(): Promise<RemindersWrapper> {
    return this.http.sendRequest<any, RemindersWrapper>("GET", `/reminders`, null, true);
  }

  /**
   * Sets (replaces) the user's delivery reminders.
   * Note: Reminders don't seem to be working yet.
   * @param {Reminder[]} reminders The new list of reminders to save.
   */
  setReminders(reminders: Reminder[]): Promise<void> {
    return this.http.sendRequest<Reminder[], void>("PUT", `/reminders`, reminders, true);
  }

  /**
   * Returns parcels (externally shipped packages tracked via a carrier).
   */
  getParcels(): Promise<Parcel[]> {
    return this.http.sendRequest<any, Parcel[]>("GET", `/parcels`, null, true);
  }

  /**
   * Returns CS contact info without requiring authentication.
   * Uses the public API endpoint (/public-api/...) with a picnic-country header.
   * @param {string} countryCode The country code to pass as the picnic-country header (e.g. 'NL').
   */
  async getUnauthenticatedContactInfo(countryCode: string): Promise<CustomerServiceContactInfo> {
    const publicUrl = this.http.url.replace("/api/", "/public-api/");
    const response = await fetch(`${publicUrl}/cs-contact-info`, {
      headers: { "picnic-country": countryCode },
    });
    return response.json() as Promise<CustomerServiceContactInfo>;
  }
}
