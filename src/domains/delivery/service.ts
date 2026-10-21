import type HttpClient from "../../http-client";
import { RawDelivery, Delivery, DeliveryPosition, DeliveryRoute, RawDeliveryPosition, RawDeliveryScenario, DeliverySummary, DeliveryTracking } from "./types";
import { DeliveryStatus } from "../cart/types";
import { extractDeliverySummaries } from "./helpers";
import { combineDeliveryTracking, extractDelivery, extractDeliveryPosition, extractDeliveryRoute } from "./details";

export class DeliveryService {
  constructor(private http: HttpClient) {}

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
   * Returns a delivery as the app's order history shows it: its orders with their lines (read
   * like the cart's), the returned containers and the totals over all orders.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  async getDelivery(deliveryId: string): Promise<Delivery> {
    return extractDelivery(await this.http.sendRequest<null, RawDelivery>("GET", `/deliveries/${encodeURIComponent(deliveryId)}`));
  }

  /**
   * Returns a delivery's position, which the app polls while the driver is on the way: the
   * arrival estimate, whether the delivery is in progress and the version of its route.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  async getDeliveryPosition(deliveryId: string): Promise<DeliveryPosition> {
    return extractDeliveryPosition(await this.http.sendRequest<null, RawDeliveryPosition>("GET", `/deliveries/${encodeURIComponent(deliveryId)}/position`, null, true));
  }

  /**
   * Returns a delivery's route, driver, vehicle and destination.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  async getDeliveryRoute(deliveryId: string): Promise<DeliveryRoute> {
    return extractDeliveryRoute(await this.http.sendRequest<null, RawDeliveryScenario>("GET", `/deliveries/${encodeURIComponent(deliveryId)}/scenario`, null, true));
  }

  /**
   * Returns where a delivery is: the position combined with the route. Poll again after
   * `queryInterval` while `inProgress`, passing the `route` of the previous result: the route is
   * only fetched again when the position reports another route version.
   * @param {string} deliveryId The id of the delivery to look up.
   * @param {DeliveryRoute} [knownRoute] The route from a previous call for this delivery.
   */
  async getDeliveryTracking(deliveryId: string, knownRoute?: DeliveryRoute): Promise<DeliveryTracking> {
    if (!knownRoute) {
      const [position, route] = await Promise.all([this.getDeliveryPosition(deliveryId), this.getDeliveryRoute(deliveryId)]);
      return combineDeliveryTracking(position, route);
    }
    const position = await this.getDeliveryPosition(deliveryId);
    const route = knownRoute.version === position.routeVersion ? knownRoute : await this.getDeliveryRoute(deliveryId);
    return combineDeliveryTracking(position, route);
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
