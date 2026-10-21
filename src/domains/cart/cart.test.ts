import { CartService } from "./service";
import HttpClient from "../../http-client";
import { PageClient } from "../../pages/page-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let cart: CartService;

beforeEach(() => {
  mockFetch.mockReset();
  const http = new HttpClient({ authKey: "initial-auth-key" });
  cart = new CartService(http, new PageClient(http));
});

describe("CartService - addProductsToCart", () => {
  it("should send the correct bulk add request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {},
      json: () => Promise.resolve({ id: "cart-id" }),
    });

    const products = [
      { productId: "s11295810", quantity: 2 },
      { productId: "s10000123", quantity: 1 },
    ];

    await cart.addProductsToCart(products);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/cart/products/add"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          s11295810: 2,
          s10000123: 1,
        }),
      }),
    );
  });
});

describe("CartService - getDeliverySlotOverview", () => {
  it("fetches the delivery slots and returns them parsed", async () => {
    const slot = (id: string, end: string) => ({
      slot_id: id,
      window_start: "2026-10-17T18:00:00.000+02:00",
      window_end: end,
      cut_off_time: "2026-10-16T22:00:00.000+02:00",
      is_available: true,
      selected: false,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {},
      json: () =>
        Promise.resolve({
          delivery_slots: [slot("regular", "2026-10-17T19:00:00.000+02:00"), slot("green", "2026-10-17T20:00:00.000+02:00")],
          selected_slot: { slot_id: "green", state: "EXPLICIT" },
        }),
    });

    const overview = await cart.getDeliverySlotOverview();

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/cart/delivery_slots"), expect.objectContaining({ method: "GET" }));
    expect(overview.slots.map((s) => [s.slotId, s.isGreenChoice])).toEqual([
      ["regular", false],
      ["green", true],
    ]);
    expect(overview.selectedSlot).toMatchObject({ slotId: "green", windowEnd: "2026-10-17T20:00:00.000+02:00", isExplicitSelection: true });
  });
});

describe("CartService - checkout", () => {
  it("should send start checkout request with mts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {},
      json: () => Promise.resolve({ order_id: "order-1", total_price: 1000 }),
    });

    await cart.startCheckout({ mts: 1234567890 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/cart/checkout/start"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mts: 1234567890, oos_article_ids: null }),
      }),
    );
  });

  it("should send initiate payment request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {},
      json: () =>
        Promise.resolve({
          payment_id: "pay-1",
          transaction_id: "tx-1",
          action: { type: "redirect", redirect_url: "https://bank.example/pay" },
        }),
    });

    await cart.initiatePayment("order-1", "https://example.com/return");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/cart/checkout/initiate_payment"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          order_id: "order-1",
          app_return_url: "https://example.com/return",
        }),
      }),
    );
  });

  it("should throw CheckoutIssueError for cart issues", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      text: () =>
        Promise.resolve(
          JSON.stringify({
            code: "CART_HAS_ISSUES",
            details: {
              type: "LEGACY_ALCOHOL_AGE_VERIFICATION_REQUIRED",
              localized_title: "18+",
              localized_message: "Confirm age",
              resolve_key: "age_verified",
              blocking: false,
            },
          }),
        ),
    });

    await expect(cart.startCheckout({ mts: 1 })).rejects.toMatchObject({
      name: "CheckoutIssueError",
      resolveKey: "age_verified",
    });
  });
});
