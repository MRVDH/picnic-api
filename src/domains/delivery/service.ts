import type HttpClient from "../../http-client";
import { Delivery, DeliveryDetail, DeliveryPosition, DeliveryScenario } from "./types";
import { DeliveryStatus } from "../cart/types";

export class DeliveryService {
  constructor(private http: HttpClient) {}

  /**
   * Returns all past and current deliveries.
   * @param {DeliveryStatus[]} [filter=[]] An array of delivery statuses to filter on.
   */
  getDeliveries(filter: DeliveryStatus[] = []): Promise<Delivery[]> {
    return this.http.sendRequest<any, Delivery[]>("POST", `/deliveries/summary`, filter);
  }

  /**
   * Returns the details of a specific delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDelivery(deliveryId: string): Promise<DeliveryDetail> {
    return this.http.sendRequest<any, DeliveryDetail>("GET", `/deliveries/${deliveryId}`);
  }

  /**
   * Returns the position data of a specific delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDeliveryPosition(deliveryId: string): Promise<DeliveryPosition> {
    return this.http.sendRequest<any, DeliveryPosition>("GET", `/deliveries/${deliveryId}/position`, null, true);
  }

  /**
   * Returns the driver and route information of a delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDeliveryScenario(deliveryId: string): Promise<DeliveryScenario> {
    return this.http.sendRequest<any, DeliveryScenario>("GET", `/deliveries/${deliveryId}/scenario`, null, true);
  }

  /**
   * Cancels an order by delivery id.
   * @param {string} deliveryId
   */
  cancelDelivery(deliveryId: string): Promise<any> {
    return this.http.sendRequest<any, any>("POST", `/order/delivery/${deliveryId}/cancel`);
  }

  /**
   * Sets a rating for a delivery from 0 to 10. Returns 400 if the delivery already has a rating.
   * @param {string} deliveryId
   * @param {number} rating
   */
  setDeliveryRating(deliveryId: string, rating: number): Promise<string> {
    return this.http.sendRequest<any, string>("POST", `/deliveries/${deliveryId}/rating`, { rating });
  }

  /**
   * (Re)sends the invoice email for a delivery.
   * @param {string} deliveryId
   */
  sendDeliveryInvoiceEmail(deliveryId: string): Promise<string> {
    return this.http.sendRequest<any, string>("POST", `/deliveries/${deliveryId}/resend_invoice_email`);
  }
}
