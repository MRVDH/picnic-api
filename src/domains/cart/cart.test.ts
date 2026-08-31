import { CartService } from "./service";
import HttpClient from "../../http-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let cart: CartService;

beforeEach(() => {
  mockFetch.mockReset();
  cart = new CartService(new HttpClient({ authKey: "initial-auth-key" }));
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
