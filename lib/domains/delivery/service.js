"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryService = void 0;
class DeliveryService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns all past and current deliveries.
     * @param {DeliveryStatus[]} [filter=[]] An array of delivery statuses to filter on.
     */
    getDeliveries(filter = []) {
        return this.http.sendRequest("POST", `/deliveries/summary`, filter);
    }
    /**
     * Returns the details of a specific delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDelivery(deliveryId) {
        return this.http.sendRequest("GET", `/deliveries/${deliveryId}`);
    }
    /**
     * Returns the position data of a specific delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryPosition(deliveryId) {
        return this.http.sendRequest("GET", `/deliveries/${deliveryId}/position`, null, true);
    }
    /**
     * Returns the driver and route information of a delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryScenario(deliveryId) {
        return this.http.sendRequest("GET", `/deliveries/${deliveryId}/scenario`, null, true);
    }
    /**
     * Cancels an order by delivery id.
     * @param {string} deliveryId
     */
    cancelDelivery(deliveryId) {
        return this.http.sendRequest("POST", `/order/delivery/${deliveryId}/cancel`);
    }
    /**
     * Sets a rating for a delivery from 0 to 10. Returns 400 if the delivery already has a rating.
     * @param {string} deliveryId
     * @param {number} rating
     */
    setDeliveryRating(deliveryId, rating) {
        return this.http.sendRequest("POST", `/deliveries/${deliveryId}/rating`, { rating });
    }
    /**
     * (Re)sends the invoice email for a delivery.
     * @param {string} deliveryId
     */
    sendDeliveryInvoiceEmail(deliveryId) {
        return this.http.sendRequest("POST", `/deliveries/${deliveryId}/resend_invoice_email`);
    }
}
exports.DeliveryService = DeliveryService;
//# sourceMappingURL=service.js.map