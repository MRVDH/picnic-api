"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerServiceService = void 0;
class CustomerServiceService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns customer service contact details and opening times.
     */
    getContactInfo() {
        return this.http.sendRequest("GET", `/cs-contact-info`, null, true);
    }
    /**
     * Returns popup messages in the app (e.g. post-delivery satisfaction prompts,
     * message bar notifications, order-confirmation cards).
     * @param {MessageDisplayPosition[]} [displayPositions] Optional filter by display position(s).
     */
    getMessages(displayPositions) {
        const query = displayPositions?.length ? `?${displayPositions.map((p) => `display_position=${encodeURIComponent(p)}`).join("&")}` : "";
        return this.http.sendRequest("GET", `/messages${query}`, null, true);
    }
    /**
     * Returns the user's configured delivery reminders.
     * Note: Reminders don't seem to be working yet.
     */
    getReminders() {
        return this.http.sendRequest("GET", `/reminders`, null, true);
    }
    /**
     * Sets (replaces) the user's delivery reminders.
     * Note: Reminders don't seem to be working yet.
     * @param {Reminder[]} reminders The new list of reminders to save.
     */
    setReminders(reminders) {
        return this.http.sendRequest("PUT", `/reminders`, reminders, true);
    }
    /**
     * Returns parcels (externally shipped packages tracked via a carrier).
     */
    getParcels() {
        return this.http.sendRequest("GET", `/parcels`, null, true);
    }
    /**
     * Returns CS contact info without requiring authentication.
     * Uses the public API endpoint (/public-api/...) with a picnic-country header.
     * @param {string} countryCode The country code to pass as the picnic-country header (e.g. 'NL').
     */
    async getUnauthenticatedContactInfo(countryCode) {
        const publicUrl = this.http.url.replace("/api/", "/public-api/");
        const response = await fetch(`${publicUrl}/cs-contact-info`, {
            headers: { "picnic-country": countryCode },
        });
        return response.json();
    }
}
exports.CustomerServiceService = CustomerServiceService;
//# sourceMappingURL=service.js.map