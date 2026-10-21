import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Delivery - getDelivery", () => {
  it("reads the orders and lines of the latest completed delivery", async () => {
    const [latest] = await client.delivery.getDeliverySummaries(["COMPLETED"]);
    if (!latest) return;

    const details = await client.delivery.getDelivery(latest.id);
    expect(details.id).toBe(latest.id);
    expect(details.orders.length).toBeGreaterThan(0);
    expect(details.totalCount).toBe(details.orders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0));
    for (const item of details.orders.flatMap((order) => order.items)) expect(item.productId).toMatch(/^s\d+$/);
  });
});

describe("Delivery - getDeliveryTracking", () => {
  it("reads the position and the route, and reuses a known route of the same version", async () => {
    const [latest] = await client.delivery.getDeliverySummaries(["COMPLETED"]);
    if (!latest) return;

    const tracking = await client.delivery.getDeliveryTracking(latest.id);
    expect(tracking.routeVersion).toBe(tracking.route.version);

    const again = await client.delivery.getDeliveryTracking(latest.id, tracking.route);
    expect(again.route).toBe(tracking.route);
  });
});

describe("Payment - getWalletTransaction", () => {
  it("reads the latest payment", async () => {
    const [latest] = await client.payment.getWalletTransactions(1);
    if (!latest) return;

    const payment = await client.payment.getWalletTransaction(latest.id);
    expect(payment.id).toBe(latest.id);
    expect(payment.amount).toBe(latest.amount_in_cents);
  });
});
