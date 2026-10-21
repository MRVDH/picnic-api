import { combineDeliveryTracking, extractDelivery, extractDeliveryPosition, extractDeliveryRoute } from "./delivery";
import type { RawDelivery, RawDeliveryPosition, RawDeliveryScenario } from "./types";

const line = (id: string, articleId: string, extra: Record<string, unknown> = {}) => ({
  type: "ORDER_LINE",
  id,
  price: 398,
  display_price: 398,
  items: [{ type: "ORDER_ARTICLE", id: articleId, name: `Product ${articleId}`, unit_quantity: "500 gram", price: 199, max_count: 50, image_ids: [`image-${articleId}`], decorators: [{ type: "QUANTITY", quantity: 2 }] }],
  ...extra,
});

describe("extractDelivery", () => {
  it("reads the orders with their lines and sums the totals", () => {
    const delivery = {
      delivery_id: "d1",
      status: "COMPLETED",
      creation_time: "2026-10-01T10:00:00.000+02:00",
      slot: { window_start: "2026-10-02T18:00:00.000+02:00", window_end: "2026-10-02T19:00:00.000+02:00" },
      returned_containers: [{ type: "CRATE", localized_name: "Kratten", quantity: 2, price: 300 }],
      orders: [
        {
          id: "o1",
          status: "COMPLETED",
          creation_time: "2026-10-01T10:00:00.000+02:00",
          items: [line("l1", "s1")],
          decorator_overrides: { s1: [{ type: "PRICE", display_price: 358 }] },
          total_price: 358,
          checkout_total_price: 408,
          total_savings: 0,
          membership_savings: 40,
          total_deposit: 50,
          deposit_breakdown: [{ type: "BAG", value: 25, count: 2 }],
          fees: [],
          cancellable: false,
          transaction_info: { payment_type: "IDEAL", redacted_iban: "NL** **** 0000", bank_id: "BANK" },
        },
        { id: "o2", status: "COMPLETED", items: [line("l2", "s2")], total_price: 398, checkout_total_price: 398, cancellable: true },
      ],
    } as unknown as RawDelivery;

    const details = extractDelivery(delivery);

    expect(details).toMatchObject({
      id: "d1",
      windowStart: "2026-10-02T18:00:00.000+02:00",
      totalPrice: 806,
      totalCount: 4,
      discount: 40,
      membershipSavings: 40,
      depositTotal: 50,
      cancellable: true,
      returnedContainers: [{ type: "CRATE", name: "Kratten", quantity: 2, price: 300 }],
    });
    expect(details.orders[0]).toMatchObject({
      items: [{ productId: "s1", quantity: 2, displayPrice: 358, originalPrice: 398 }],
      payment: { paymentType: "IDEAL", redactedIban: "NL** **** 0000", bankId: "BANK" },
    });
    expect(details.orders[1].payment).toBeNull();
  });
});

describe("delivery tracking", () => {
  it("finds the current position on the route by time and reads the driver and destination", () => {
    const position = extractDeliveryPosition({ version: 3, scenario_ts: 1050, eta: 5000, eta_window: { start: "18:00", end: "18:20" }, query_interval: 10000, scenario_in_progress: true } as unknown as RawDeliveryPosition);
    const route = extractDeliveryRoute({
      version: 3,
      scenario: [{ lat: 52.1, lng: 4.1, ts: 1000 }, { lat: 52.2, lng: 4.2, ts: 1100 }, { lat: 0, lng: 0, ts: 1200 }],
      vehicle: { name: "EV", image: "iVBOR" },
      driver: { name: "Jan", photo_url: "https://example.com/photo.jpg" },
    } as unknown as RawDeliveryScenario);

    expect(combineDeliveryTracking(position, route)).toEqual({
      routeVersion: 3,
      inProgress: true,
      queryInterval: 10000,
      eta: 5000,
      etaWindowStart: "18:00",
      etaWindowEnd: "18:20",
      routeTime: 1050,
      currentPosition: { lat: 52.1, lng: 4.1, ts: 1000 },
      route: {
        version: 3,
        points: [{ lat: 52.1, lng: 4.1, ts: 1000 }, { lat: 52.2, lng: 4.2, ts: 1100 }],
        driverName: "Jan",
        driverPhotoUrl: "https://example.com/photo.jpg",
        vehicleName: "EV",
        vehicleImageDataUrl: "data:image/png;base64,iVBOR",
        destination: { lat: 52.2, lng: 4.2, street: null, city: null, postcode: null },
      },
    });
  });
});
