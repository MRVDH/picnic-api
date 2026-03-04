"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
class CartService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the cart of the current user.
     */
    getCart() {
        return this.http.sendRequest("GET", `/cart`);
    }
    /**
     * Adds a product to the shopping cart.
     * @param {string} productId The id of the product to add.
     * @param {number} [count=1] The amount of this product to add.
     */
    addProductToCart(productId, count = 1) {
        return this.http.sendRequest("POST", `/cart/add_product`, { product_id: productId, count });
    }
    /**
     * Removes a product from the shopping cart.
     * @param {string} productId The id of the product to remove.
     * @param {number} [count=1] The amount of this product to remove.
     */
    removeProductFromCart(productId, count = 1) {
        return this.http.sendRequest("POST", `/cart/remove_product`, { product_id: productId, count });
    }
    /**
     * Clears all items from the shopping cart.
     */
    clearCart() {
        return this.http.sendRequest("POST", `/cart/clear`);
    }
    /**
     * Returns all available delivery slots.
     */
    getDeliverySlots() {
        return this.http.sendRequest("GET", `/cart/delivery_slots`);
    }
    /**
     * Selects a delivery slot.
     * @param {string} slotId The id of the delivery slot to select.
     */
    setDeliverySlot(slotId) {
        return this.http.sendRequest("POST", `/cart/set_delivery_slot`, { slot_id: slotId });
    }
    /**
     * Returns the status of an order (not delivery) by its id.
     * @param {string} orderId
     */
    getOrderStatus(orderId) {
        return this.http.sendRequest("GET", `/cart/checkout/order/${orderId}/status`);
    }
    /**
     * Removes an entire group of products from the cart at once.
     * @param {string} groupId The id of the group to remove.
     */
    removeGroupFromCart(groupId) {
        return this.http.sendRequest("POST", `/cart/remove_group`, { group_id: groupId });
    }
    /**
     * Returns the minimum order value for the currently selected delivery slot.
     * Requires a delivery slot to be selected; otherwise the API returns a 500 error.
     */
    getMinimumOrderValue() {
        return this.http.sendRequest("GET", `/user-slot-minimum-order-value/minimum`, null, true);
    }
    /**
     * Confirms and places an order identified by its order id.
     * @param {string} orderId The id of the order to confirm.
     */
    confirmOrder(orderId) {
        return this.http.sendRequest("POST", `/cart/checkout/order/${orderId}/confirm`);
    }
}
exports.CartService = CartService;
//# sourceMappingURL=service.js.map