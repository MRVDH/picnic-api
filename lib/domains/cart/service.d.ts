import type HttpClient from "../../http-client";
import { Cart, CheckoutConfirmation, GetDeliverySlotsResult, OrderStatus, UserSlotMinimumOrderValue } from "./types";
export declare class CartService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the cart of the current user.
     */
    getCart(): Promise<Cart>;
    /**
     * Adds a product to the shopping cart.
     * @param {string} productId The id of the product to add.
     * @param {number} [count=1] The amount of this product to add.
     */
    addProductToCart(productId: string, count?: number): Promise<Cart>;
    /**
     * Removes a product from the shopping cart.
     * @param {string} productId The id of the product to remove.
     * @param {number} [count=1] The amount of this product to remove.
     */
    removeProductFromCart(productId: string, count?: number): Promise<Cart>;
    /**
     * Clears all items from the shopping cart.
     */
    clearCart(): Promise<Cart>;
    /**
     * Returns all available delivery slots.
     */
    getDeliverySlots(): Promise<GetDeliverySlotsResult>;
    /**
     * Selects a delivery slot.
     * @param {string} slotId The id of the delivery slot to select.
     */
    setDeliverySlot(slotId: string): Promise<Cart>;
    /**
     * Returns the status of an order (not delivery) by its id.
     * @param {string} orderId
     */
    getOrderStatus(orderId: string): Promise<OrderStatus>;
    /**
     * Removes an entire group of products from the cart at once.
     * @param {string} groupId The id of the group to remove.
     */
    removeGroupFromCart(groupId: string): Promise<Cart>;
    /**
     * Returns the minimum order value for the currently selected delivery slot.
     * Requires a delivery slot to be selected; otherwise the API returns a 500 error.
     */
    getMinimumOrderValue(): Promise<UserSlotMinimumOrderValue>;
    /**
     * Confirms and places an order identified by its order id.
     * @param {string} orderId The id of the order to confirm.
     */
    confirmOrder(orderId: string): Promise<CheckoutConfirmation>;
}
//# sourceMappingURL=service.d.ts.map