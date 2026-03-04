import type HttpClient from "../../http-client";
import { CustomerServiceContactInfo, MessagesWrapper, MessageDisplayPosition, RemindersWrapper, Reminder, Parcel } from "./types";
export declare class CustomerServiceService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns customer service contact details and opening times.
     */
    getContactInfo(): Promise<CustomerServiceContactInfo>;
    /**
     * Returns popup messages in the app (e.g. post-delivery satisfaction prompts,
     * message bar notifications, order-confirmation cards).
     * @param {MessageDisplayPosition[]} [displayPositions] Optional filter by display position(s).
     */
    getMessages(displayPositions?: MessageDisplayPosition[]): Promise<MessagesWrapper>;
    /**
     * Returns the user's configured delivery reminders.
     * Note: Reminders don't seem to be working yet.
     */
    getReminders(): Promise<RemindersWrapper>;
    /**
     * Sets (replaces) the user's delivery reminders.
     * Note: Reminders don't seem to be working yet.
     * @param {Reminder[]} reminders The new list of reminders to save.
     */
    setReminders(reminders: Reminder[]): Promise<void>;
    /**
     * Returns parcels (externally shipped packages tracked via a carrier).
     */
    getParcels(): Promise<Parcel[]>;
    /**
     * Returns CS contact info without requiring authentication.
     * Uses the public API endpoint (/public-api/...) with a picnic-country header.
     * @param {string} countryCode The country code to pass as the picnic-country header (e.g. 'NL').
     */
    getUnauthenticatedContactInfo(countryCode: string): Promise<CustomerServiceContactInfo>;
}
//# sourceMappingURL=service.d.ts.map