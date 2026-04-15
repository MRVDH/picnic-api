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
