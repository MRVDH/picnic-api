import type HttpClient from "../../http-client";
import {
  AddProductInput,
  AddProductsItem,
  CancelCheckoutInput,
  RawCart,
  CheckoutConfirmation,
  CheckoutStartInput,
  CheckoutStartResult,
  Cart,
  CartFooter,
  CheckoutStatusResult,
  DeliverySlots,
  RawDeliverySlots,
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
import { extractCart } from "./contents";
import type { PageClient } from "../../pages/page-client";

/** The app's basket footer page. */
const BASKET_FOOTER_PAGE_ID = "basket-footer-section-root";

export class CartService {
  constructor(
    private http: HttpClient,
    private pages: PageClient,
  ) {}

  /**
   * Returns the cart footer as the app's basket shows it: the loyalty points line and the
   * recommendation tiles ("Niets vergeten?"). The rest of the basket comes from {@link getCart}.
   * @throws {UnexpectedPageFormatError} When Picnic serves the page as RSC.
   */
  async getCartFooter(): Promise<CartFooter> {
    return extractCartFooter(await this.pages.getFusionPage<unknown>(BASKET_FOOTER_PAGE_ID));
  }

  /**
   * Returns the cart as the app's basket shows it: the lines with decorator overrides applied
   * (quantities, member prices, labels, unavailability), the totals, deposits, fees, the
   * selected slot and the recipes. The cart mutations return the cart in the same form.
   */
  async getCart(): Promise<Cart> {
    return extractCart(await this.http.sendRequest<null, RawCart>("GET", `/cart`, null, true));
  }

  /** Sends a cart mutation and returns the cart it responds with. */
  private async mutate<TRequestData>(path: string, data: TRequestData | null): Promise<Cart> {
    return extractCart(await this.http.sendRequest<TRequestData, RawCart>("POST", path, data, true));
  }

  /**
   * Adds a product to the cart and returns the cart.
   * @param {string} productId The id of the product to add.
   * @param {number} [count=1] The amount of this product to add.
   * @param {SellingUnitContext[]} [sellingUnitContexts] Contexts that say where the product was added from (e.g. a recipe).
   */
  addProductToCart(productId: string, count: number = 1, sellingUnitContexts?: SellingUnitContext[]): Promise<Cart> {
    return this.mutate<AddProductInput>(`/cart/add_product`, {
      product_id: productId,
      count,
      ...(sellingUnitContexts && { selling_unit_contexts: sellingUnitContexts }),
    });
  }

  /**
   * Adds multiple products to the cart in a single request and returns the cart.
   * @param {AddProductsItem[]} products The products with their ids and quantities.
   */
  addProductsToCart(products: AddProductsItem[]): Promise<Cart> {
    const body: Record<string, number> = {};
    for (const { productId, quantity } of products) {
      body[productId] = quantity;
    }
    return this.mutate<Record<string, number>>(`/cart/products/add`, body);
  }

  /**
   * Removes a product from the cart and returns the cart.
   * @param {string} productId The id of the product to remove.
   * @param {number} [count=1] The amount of this product to remove.
   * @param {SellingUnitContext[]} [sellingUnitContexts] Contexts that say where the product was removed from (e.g. a recipe).
   */
  removeProductFromCart(productId: string, count: number = 1, sellingUnitContexts?: SellingUnitContext[]): Promise<Cart> {
    return this.mutate<AddProductInput>(`/cart/remove_product`, {
      product_id: productId,
      count,
      ...(sellingUnitContexts && { selling_unit_contexts: sellingUnitContexts }),
    });
  }

  /**
   * Removes all products from the cart and returns the cart.
   */
  clearCart(): Promise<Cart> {
    return this.mutate<null>(`/cart/clear`, null);
  }

  /**
   * Returns the delivery slots with a green-choice flag, and the selected slot with its window.
   */
  async getDeliverySlots(): Promise<DeliverySlots> {
    return extractDeliverySlots(await this.http.sendRequest<null, RawDeliverySlots>("GET", `/cart/delivery_slots`));
  }

  /**
   * Selects a delivery slot and returns the cart.
   * @param {string} slotId The id of the delivery slot to select.
   */
  setDeliverySlot(slotId: string): Promise<Cart> {
    return this.mutate<SetDeliverySlotInput>(`/cart/set_delivery_slot`, { slot_id: slotId });
  }

  /**
   * Returns the status of an order (not delivery) by its id.
   * @param {string} orderId
   */
  getOrderStatus(orderId: string): Promise<OrderStatus> {
    return this.http.sendRequest<any, OrderStatus>("GET", `/cart/checkout/order/${orderId}/status`);
  }

  /**
   * Removes a group of products from the cart at once and returns the cart.
   * @param {string} groupId The id of the group to remove.
   */
  removeGroupFromCart(groupId: string): Promise<Cart> {
    return this.mutate<RemoveGroupInput>(`/cart/remove_group`, { group_id: groupId });
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
