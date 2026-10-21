import type HttpClient from "../../http-client";
import {
  AddProductInput,
  AddProductsItem,
  CancelCheckoutInput,
  Cart,
  CheckoutConfirmation,
  CheckoutStartInput,
  CheckoutStartResult,
  CartContents,
  CartFooter,
  CheckoutStatusResult,
  DeliverySlotOverview,
  GetDeliverySlotsResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  OrderStatus,
  RemoveGroupInput,
  SellingUnitContext,
  SetDeliverySlotInput,
  UserSlotMinimumOrderValue,
} from "./types";
import { extractDeliverySlots } from "./helpers";
import { extractCartFooter } from "./footer-helpers";
import { extractCartContents } from "./contents";
import type { PageClient } from "../../pages/page-client";

/** The app's basket footer page. */
const BASKET_FOOTER_PAGE_ID = "basket-footer-section-root";

export class CartService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /**
   * Returns the basket footer: the loyalty points line and the "Niets vergeten?" recommendation tiles.
   * The rest of the basket comes from {@link getCart}.
   * @throws {UnexpectedPageFormatError} When Picnic serves the page as RSC.
   */
  async getBasketFooter(): Promise<CartFooter> {
    return extractCartFooter(await this.pages.getFusionPage<unknown>(BASKET_FOOTER_PAGE_ID));
  }

  /**
   * Returns the cart of the current user.
   */
  getCart(): Promise<Cart> {
    return this.http.sendRequest<any, Cart>("GET", `/cart`, null, true);
  }

  /**
   * Returns the cart as the app's basket shows it: the lines with decorator overrides applied
   * (quantities, member prices, labels, unavailability), the totals, deposits, fees, the
   * selected slot and the recipes. See {@link parseCart} for the result of a cart mutation.
   */
  async getCartContents(): Promise<CartContents> {
    return extractCartContents(await this.getCart());
  }

  /**
   * Turns a cart response into {@link CartContents} without a request. Use it on what the cart
   * mutations return, e.g. `cart.parseCart(await cart.addProductToCart(id))`.
   * @param {Cart} cart A cart response.
   */
  parseCart(cart: Cart): CartContents {
    return extractCartContents(cart);
  }

  /**
   * Adds a product to the shopping cart.
   * @param {string} productId The id of the product to add.
   * @param {number} [count=1] The amount of this product to add.
   * @param {SellingUnitContext[]} [sellingUnitContexts] Optional contexts to track the origin of the mutation (e.g. recipe, meal plan).
   */
  addProductToCart(productId: string, count: number = 1, sellingUnitContexts?: SellingUnitContext[]): Promise<Cart> {
    return this.http.sendRequest<AddProductInput, Cart>("POST", `/cart/add_product`, {
      product_id: productId,
      count,
      ...(sellingUnitContexts && { selling_unit_contexts: sellingUnitContexts }),
    }, true);
  }

  /**
   * Adds multiple products to the shopping cart in a single request.
   * @param {AddProductsItem[]} products An array of products with their ids and quantities.
   */
  addProductsToCart(products: AddProductsItem[]): Promise<Cart> {
    const body: Record<string, number> = {};
    for (const { productId, quantity } of products) {
      body[productId] = quantity;
    }
    return this.http.sendRequest<Record<string, number>, Cart>("POST", `/cart/products/add`, body, true);
  }

  /**
   * Removes a product from the shopping cart.
   * @param {string} productId The id of the product to remove.
   * @param {number} [count=1] The amount of this product to remove.
   * @param {SellingUnitContext[]} [sellingUnitContexts] Optional contexts to track the origin of the mutation (e.g. recipe, meal plan).
   */
  removeProductFromCart(productId: string, count: number = 1, sellingUnitContexts?: SellingUnitContext[]): Promise<Cart> {
    return this.http.sendRequest<AddProductInput, Cart>("POST", `/cart/remove_product`, {
      product_id: productId,
      count,
      ...(sellingUnitContexts && { selling_unit_contexts: sellingUnitContexts }),
    }, true);
  }

  /**
   * Clears all items from the shopping cart.
   */
  clearCart(): Promise<Cart> {
    return this.http.sendRequest<any, Cart>("POST", `/cart/clear`, null, true);
  }

  /**
   * Returns all available delivery slots.
   */
  getDeliverySlots(): Promise<GetDeliverySlotsResult> {
    return this.http.sendRequest<any, GetDeliverySlotsResult>("GET", `/cart/delivery_slots`);
  }

  /**
   * Returns all delivery slots with camelCase fields and a green-choice flag, and the selected slot with its window.
   * This is a convenience wrapper around {@link getDeliverySlots}.
   */
  async getDeliverySlotOverview(): Promise<DeliverySlotOverview> {
    return extractDeliverySlots(await this.getDeliverySlots());
  }

  /**
   * Selects a delivery slot.
   * @param {string} slotId The id of the delivery slot to select.
   */
  setDeliverySlot(slotId: string): Promise<Cart> {
    return this.http.sendRequest<SetDeliverySlotInput, Cart>("POST", `/cart/set_delivery_slot`, { slot_id: slotId }, true);
  }

  /**
   * Returns the status of an order (not delivery) by its id.
   * @param {string} orderId
   */
  getOrderStatus(orderId: string): Promise<OrderStatus> {
    return this.http.sendRequest<any, OrderStatus>("GET", `/cart/checkout/order/${orderId}/status`);
  }

  /**
   * Removes an entire group of products from the cart at once.
   * @param {string} groupId The id of the group to remove.
   */
  removeGroupFromCart(groupId: string): Promise<Cart> {
    return this.http.sendRequest<RemoveGroupInput, Cart>("POST", `/cart/remove_group`, { group_id: groupId }, true);
  }

  /**
   * Returns the minimum order value for the currently selected delivery slot.
   * Requires a delivery slot to be selected; otherwise the API returns a 500 error.
   */
  getMinimumOrderValue(): Promise<UserSlotMinimumOrderValue> {
    return this.http.sendRequest<void, UserSlotMinimumOrderValue>("GET", `/user-slot-minimum-order-value/minimum`, null, true);
  }

  /**
   * Confirms and places an order identified by its order id.
   * @param {string} orderId The id of the order to confirm.
   */
  confirmOrder(orderId: string): Promise<CheckoutConfirmation> {
    return this.http.sendRequest<void, CheckoutConfirmation>("POST", `/cart/checkout/order/${orderId}/confirm`);
  }

  /**
   * Starts the checkout flow for the current cart.
   * Requires cart.mts to match the current cart modification timestamp.
   * May throw CheckoutIssueError when the cart has blocking issues (e.g. alcohol age check).
   */
  startCheckout(input: CheckoutStartInput): Promise<CheckoutStartResult> {
    return this.http.sendRequest<CheckoutStartInput, CheckoutStartResult>(
      "POST",
      `/cart/checkout/start`,
      {
        mts: input.mts,
        oos_article_ids: input.oos_article_ids ?? null,
        ...(input.resolve_key ? { resolve_key: input.resolve_key } : {}),
      },
      true,
    );
  }

  /**
   * Initiates payment for a checkout order and returns a bank redirect URL.
   */
  initiatePayment(orderId: string, appReturnUrl: string): Promise<InitiatePaymentResult> {
    const body: InitiatePaymentInput = {
      order_id: orderId,
      app_return_url: appReturnUrl,
    };
    return this.http.sendRequest<InitiatePaymentInput, InitiatePaymentResult>(
      "POST",
      `/cart/checkout/initiate_payment`,
      body,
      true,
    );
  }

  /**
   * Polls checkout payment status while a transaction is in progress.
   */
  getCheckoutStatus(transactionId: string): Promise<CheckoutStatusResult> {
    return this.http.sendRequest<void, CheckoutStatusResult>(
      "GET",
      `/cart/checkout/${transactionId}/status`,
    );
  }

  /**
   * Cancels an in-progress checkout transaction.
   */
  cancelCheckout(transactionId: string): Promise<void> {
    const body: CancelCheckoutInput = { transaction_id: transactionId };
    return this.http.sendRequest<CancelCheckoutInput, void>(
      "POST",
      `/cart/checkout/cancel`,
      body,
      true,
    );
  }
}
