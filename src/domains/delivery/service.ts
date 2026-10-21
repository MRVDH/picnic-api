import type HttpClient from "../../http-client";
import { Delivery, DeliveryDetail, DeliveryDetails, DeliveryPosition, DeliveryScenario, DeliverySummary, DeliveryTracking } from "./types";
import { DeliveryStatus } from "../cart/types";
import { extractDeliverySummaries } from "./helpers";
import { extractDeliveryDetails, extractDeliveryTracking } from "./details";

export class DeliveryService {
  constructor(private http: HttpClient) {}

  /**
   * Returns all past and current deliveries, as returned by the API.
   * @deprecated use getDeliverySummaries, which returns typed, summed entries.
   * @param {DeliveryStatus[]} [filter=[]] An array of delivery statuses to filter on.
   */
  getDeliveries(filter: DeliveryStatus[] = []): Promise<Delivery[]> {
    return this.http.sendRequest<any, Delivery[]>("POST", `/deliveries/summary`, filter);
  }

  /**
   * Returns all past and current deliveries as summaries, newest first.
   * Totals are summed over each delivery's orders.
   * @param {DeliveryStatus[]} [filter=[]] An array of delivery statuses to filter on.
   */
  async getDeliverySummaries(filter: DeliveryStatus[] = []): Promise<DeliverySummary[]> {
    const raw = await this.http.sendRequest<DeliveryStatus[], unknown>("POST", `/deliveries/summary`, filter);
    return extractDeliverySummaries(raw);
  }

  /**
   * Returns the details of a specific delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDelivery(deliveryId: string): Promise<DeliveryDetail> {
    return this.http.sendRequest<any, DeliveryDetail>("GET", `/deliveries/${deliveryId}`);
  }

  /**
   * Returns a delivery as the app's order history shows it: its orders with their lines (read
   * like the cart's), the returned containers and the totals over all orders.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  async getDeliveryDetails(deliveryId: string): Promise<DeliveryDetails> {
    return extractDeliveryDetails(await this.getDelivery(deliveryId));
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
   * Returns where a delivery is: the position combined with the route, the arrival estimate, the
   * driver and the destination. Poll again after `queryInterval` while `inProgress`. To poll
   * without fetching the route each time, use {@link parseTracking} with a cached scenario.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  async getDeliveryTracking(deliveryId: string): Promise<DeliveryTracking> {
    const [position, scenario] = await Promise.all([this.getDeliveryPosition(deliveryId), this.getDeliveryScenario(deliveryId)]);
    return extractDeliveryTracking(position, scenario);
  }

  /**
   * Combines a position and a route into {@link DeliveryTracking} without a request. The route
   * only changes when the position reports another `version`.
   * @param {DeliveryPosition} position From {@link getDeliveryPosition}.
   * @param {DeliveryScenario} scenario From {@link getDeliveryScenario}.
   */
  parseTracking(position: DeliveryPosition, scenario: DeliveryScenario): DeliveryTracking {
    return extractDeliveryTracking(position, scenario);
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
