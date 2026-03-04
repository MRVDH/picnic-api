import type HttpClient from "../../http-client";
import {
  AddProductInput,
  Cart,
  CheckoutConfirmation,
  GetDeliverySlotsResult,
  OrderStatus,
  RemoveGroupInput,
  SetDeliverySlotInput,
  UserSlotMinimumOrderValue,
} from "./types";

export class CartService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the cart of the current user.
   */
  getCart(): Promise<Cart> {
    return this.http.sendRequest<any, Cart>("GET", `/cart`);
  }

  /**
   * Adds a product to the shopping cart.
   * @param {string} productId The id of the product to add.
   * @param {number} [count=1] The amount of this product to add.
   */
  addProductToCart(productId: string, count: number = 1): Promise<Cart> {
    return this.http.sendRequest<AddProductInput, Cart>("POST", `/cart/add_product`, { product_id: productId, count });
  }

  /**
   * Removes a product from the shopping cart.
   * @param {string} productId The id of the product to remove.
   * @param {number} [count=1] The amount of this product to remove.
   */
  removeProductFromCart(productId: string, count: number = 1): Promise<Cart> {
    return this.http.sendRequest<AddProductInput, Cart>("POST", `/cart/remove_product`, { product_id: productId, count });
  }

  /**
   * Clears all items from the shopping cart.
   */
  clearCart(): Promise<Cart> {
    return this.http.sendRequest<any, Cart>("POST", `/cart/clear`);
  }

  /**
   * Returns all available delivery slots.
   */
  getDeliverySlots(): Promise<GetDeliverySlotsResult> {
    return this.http.sendRequest<any, GetDeliverySlotsResult>("GET", `/cart/delivery_slots`);
  }

  /**
   * Selects a delivery slot.
   * @param {string} slotId The id of the delivery slot to select.
   */
  setDeliverySlot(slotId: string): Promise<Cart> {
    return this.http.sendRequest<SetDeliverySlotInput, Cart>("POST", `/cart/set_delivery_slot`, { slot_id: slotId });
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
    return this.http.sendRequest<RemoveGroupInput, Cart>("POST", `/cart/remove_group`, { group_id: groupId });
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
}
