import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("Cart - getCart", () => {
  it("reads the lines and totals of the cart", async () => {
    const contents = await client.cart.getCart();

    expect(contents.totalCount).toBe(contents.items.reduce((sum, item) => sum + item.quantity, 0));
    for (const item of contents.items) {
      expect(item.productId).toMatch(/^s\d+$/);
      expect(item.name).toBeTruthy();
      expect(item.displayPrice).toBeGreaterThan(0);
    }
  });
});
