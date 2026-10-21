import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Delivery - getDeliveryDetails", () => {
  it("reads the orders and lines of the latest completed delivery", async () => {
    const [latest] = await client.delivery.getDeliverySummaries(["COMPLETED"]);
    if (!latest) return;

    const details = await client.delivery.getDeliveryDetails(latest.id);
    expect(details.id).toBe(latest.id);
    expect(details.orders.length).toBeGreaterThan(0);
    expect(details.totalCount).toBe(details.orders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0));
    for (const item of details.orders.flatMap((order) => order.items)) expect(item.productId).toMatch(/^s\d+$/);
  });
});

describe("Payment - getWalletPayment", () => {
  it("reads the latest payment", async () => {
    const [latest] = await client.payment.getWalletTransactions(1);
    if (!latest) return;

    const payment = await client.payment.getWalletPayment(latest.id);
    expect(payment.id).toBe(latest.id);
    expect(payment.amount).toBe(latest.amount_in_cents);
  });
});
