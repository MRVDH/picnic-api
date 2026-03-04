import type HttpClient from "../../http-client";
import { Delivery, DeliveryDetail, DeliveryPosition, DeliveryScenario } from "./types";
import { DeliveryStatus } from "../cart/types";
export declare class DeliveryService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns all past and current deliveries.
     * @param {DeliveryStatus[]} [filter=[]] An array of delivery statuses to filter on.
     */
    getDeliveries(filter?: DeliveryStatus[]): Promise<Delivery[]>;
    /**
     * Returns the details of a specific delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDelivery(deliveryId: string): Promise<DeliveryDetail>;
    /**
     * Returns the position data of a specific delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryPosition(deliveryId: string): Promise<DeliveryPosition>;
    /**
     * Returns the driver and route information of a delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryScenario(deliveryId: string): Promise<DeliveryScenario>;
    /**
     * Cancels an order by delivery id.
     * @param {string} deliveryId
     */
    cancelDelivery(deliveryId: string): Promise<any>;
    /**
     * Sets a rating for a delivery from 0 to 10. Returns 400 if the delivery already has a rating.
     * @param {string} deliveryId
     * @param {number} rating
     */
    setDeliveryRating(deliveryId: string, rating: number): Promise<string>;
    /**
     * (Re)sends the invoice email for a delivery.
     * @param {string} deliveryId
     */
    sendDeliveryInvoiceEmail(deliveryId: string): Promise<string>;
}
//# sourceMappingURL=service.d.ts.map