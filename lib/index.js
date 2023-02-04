"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const md5_1 = __importDefault(require("crypto-js/md5"));
const enc_utf8_1 = __importDefault(require("crypto-js/enc-utf8"));
const enc_hex_1 = __importDefault(require("crypto-js/enc-hex"));
// @ts-ignore
const routes_1 = __importDefault(require("./static/routes"));
module.exports = class PicnicClient {
    /**
     * Builds the client that sends the requests.
     * @param {ApiConfig} options To configure the client.
     * @param {string} [options.countryCode=NL] The country code for the requests.
     * @param {string} [options.apiVersion=17] The api version for the requests. Does not seem to do anything yet.
     * @param {string} [options.authKey=null] The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
     * @param {string} [options.url] Custom defined endpoint.
     */
    constructor(options) {
        this.countryCode = options?.countryCode || "NL";
        this.apiVersion = options?.apiVersion || "17";
        this.authKey = options?.authKey || null;
        this.url = options?.url || `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;
        this.httpInstance = axios_1.default.create({
            baseURL: this.url
        });
    }
    /**
     * Logs the user into picnic to be able to send requests.
     * @param {string} username The username of the Picnic account.
     * @param {string} password The password of the Picnic account.
     */
    login(username, password) {
        return new Promise(async (resolve, reject) => {
            let secret = (0, md5_1.default)(enc_utf8_1.default.parse(password)).toString(enc_hex_1.default);
            try {
                const response = await this.httpInstance.post(`/user/login`, {
                    key: username,
                    secret,
                    client_id: 1
                });
                this.authKey = response.headers[`x-picnic-auth`];
                resolve({
                    authKey: this.authKey,
                    second_factor_authentication_required: response.data.second_factor_authentication_required,
                    user_id: response.data.user_id
                });
            }
            catch (error) {
                if (error?.response?.data?.error?.message) {
                    reject(`Login failed: ${error.response.data.error.message}`);
                }
                else {
                    reject(error);
                }
            }
        });
    }
    /**
     * Gets the details of the current logged in user.
     */
    getUserDetails() {
        return this.sendRequest("GET", `/user`);
    }
    /**
     * Searches in picnic products.
     * @param {string} query The keywords to search for.
     */
    search(query) {
        return this.sendRequest("GET", `/search?search_term=${encodeURIComponent(query)}`);
    }
    /**
     * returns a suggestion on Picnic products matching the query.
     * @param {string} query The keywords for suggestions.
     */
    getSuggestions(query) {
        return this.sendRequest("GET", `/suggest?search_term=${encodeURIComponent(query)}`);
    }
    /**
     * Returns the details of a specific product.
     * @deprecated no longer in the API, use getArticle
     * @param {string} productId The id of the product to get.
     */
    getProduct(productId) {
        return this.sendRequest("GET", `/product/${productId}`);
    }
    /**
     * Returns the details of a specific product.
     * @param {string} productId The id of the product to get.
     */
    getArticle(productId) {
        return this.sendRequest("GET", `/articles/${productId}`);
    }
    /**
     * Retreives product images from the server as an arrayBuffer.
     * @param {string} imageId The image id to retreive.
     * @param {ImageSize} size The size of the image to return.
     */
    getImage(imageId, size) {
        let alternateRoute = this.url.split("/api/")[0];
        return this.sendRequest("GET", `${alternateRoute}/static/images/${imageId}/${size}.png`, null, false, true);
    }
    /**
     * Retreives product images from the server ad a DataUri.
     * @param {string} imageId The image id to retreive.
     * @param {ImageSize} size The size of the image to return.
     */
    async getImageAsDataUri(imageId, size) {
        let arrayBuffer = await this.getImage(imageId, size);
        let dataUri = "data:image/png;base64," + Buffer.from(arrayBuffer, 'binary').toString('base64');
        return dataUri;
    }
    /**
     * Returns the catgories.
     * @param {number} [depth=0] The category depth of items to retrieve.
     */
    getCategories(depth = 0) {
        return this.sendRequest("GET", `/my_store?depth=${depth}`);
    }
    /**
     * Returns the shopping cart information of the user and contents.
     */
    getShoppingCart() {
        return this.sendRequest("GET", `/cart`);
    }
    /**
     * Adds a product to the shopping cart.
     * @param {string} productId The id of the product to add.
     * @param {number} [count=1] The amount of this product to add.
     */
    addProductToShoppingCart(productId, count = 1) {
        return this.sendRequest("POST", `/cart/add_product`, { product_id: productId, count });
    }
    /**
     * Removes a product from the shopping cart.
     * @param {string} productId The id of the product to remove.
     * @param {number} [count=1] The amount of this product to remove.
     */
    removeProductFromShoppingCart(productId, count = 1) {
        return this.sendRequest("POST", `/cart/remove_product`, { product_id: productId, count });
    }
    /**
     * Clears the shopping cart of the user.
     */
    clearShoppingCart() {
        return this.sendRequest("POST", `/cart/clear`);
    }
    /**
     * Get all the delivery slots.
     */
    getDeliverySlots() {
        return this.sendRequest("GET", `/cart/delivery_slots`);
    }
    /**
     * Selects a delivery slot.
     * @param {string} slotId The id of the delivery slot to be selected.
     */
    setDeliverySlot(slotId) {
        return this.sendRequest("POST", `/cart/set_delivery_slot`, { slot_id: slotId });
    }
    /**
     * Returns all past and current deliveries of the user.
     * @param {DeliveryStatus[]} [filter=[]] An array with the statusses of the deliveries to filter on.
     */
    getDeliveries(filter = []) {
        return this.sendRequest("POST", `/deliveries/summary`, filter);
    }
    /**
     * Get the details of one specific delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDelivery(deliveryId) {
        return this.sendRequest("GET", `/deliveries/${deliveryId}`);
    }
    /**
     * Get the position data of one specific delivery. For the route and delivery information, use the scenario call.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryPosition(deliveryId) {
        return this.sendRequest("GET", `/deliveries/${deliveryId}/position`, null, true);
    }
    /**
     * Get the driver and route information of the delivery.
     * @param {string} deliveryId The id of the delivery to look up.
     */
    getDeliveryScenario(deliveryId) {
        return this.sendRequest("GET", `/deliveries/${deliveryId}/scenario`, null, true);
    }
    /**
     * Cancels the order with the given delivery id.
     * @param {string} deliveryId
     */
    cancelDelivery(deliveryId) {
        return this.sendRequest("POST", `/order/delivery/${deliveryId}/cancel`);
    }
    /**
     * Sets a rating for the delivery from 0 to 10. Will return 400 if a delivery already has a rating.
     * @param {string} deliveryId
     * @param {number} rating
     */
    setDeliveryRating(deliveryId, rating) {
        return this.sendRequest("POST", `/deliveries/${deliveryId}/rating`, { rating });
    }
    /**
     * (Re)sends the invoice email of the delivery.
     * @param {string} deliveryId
     */
    sendDeliveryInvoiceEmail(deliveryId) {
        return this.sendRequest("POST", `/deliveries/${deliveryId}/resend_invoice_email`);
    }
    /**
     * Returns the status of the order (not delivery) with the given id.
     * @param {string} orderId
     */
    getOrderStatus(orderId) {
        return this.sendRequest("GET", `/cart/checkout/order/${orderId}/status`);
    }
    /**
     * Returns all the lists and sublists.
     * @param {number} [depth=0] The category depth of items to retrieve.
     */
    getLists(depth = 0) {
        return this.sendRequest("GET", `/lists?depth=${depth}`);
    }
    /**
     * Returns the sublists of a list, the articles of a sublist if the subListId is given.
     * @param {string} listId The id of the list to get.
     * @param {string} [subListId] The id of the sub list to get.
     * @param {number} [depth=0] The category depth of items to retrieve.
     */
    getList(listId, subListId, depth = 0) {
        let path = `/lists/${listId}`;
        if (subListId) {
            path += `?sublist=${subListId}`;
        }
        path += (subListId ? '&' : '?') + `depth=${depth}`;
        return this.sendRequest("GET", path);
    }
    /**
     * Returns the MGM details. This are the friends discount data.
     */
    getMgmDetails() {
        return this.sendRequest("GET", `/mgm`);
    }
    /**
     * Returns the list of consent settings.
     * @param {boolean} [general=false] Returns only the 'general' consent settings.
     */
    getConsentSettings(general = false) {
        return this.sendRequest("GET", `/consents${general ? '/general' : ''}/settings-page`);
    }
    /**
     * Sets one or multiple consent options to true or false.
     * @param {SetConsentSettingsInput} consentSettingsInput An array of objects of consent items.
     */
    setConsentSettings(consentSettingsInput) {
        return this.sendRequest("PUT", `/consents`, consentSettingsInput);
    }
    /**
     * Returns the popup messages in the app. For example, the message after a delivery, asking if the delivery was satisfactory.
     */
    getMessages() {
        return this.sendRequest("GET", `/messages`, null, true);
    }
    /**
     * Returns the reminders.
     */
    getReminders() {
        return this.sendRequest("GET", `/reminders`, null, true);
    }
    /**
     * Can be used to send custom requests that are not implemented but do need authentication for it.
     * @param {string} method The HTTP method to use, such as GET, POST, PUT and DELETE.
     * @param {string} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
     * @param {Object|Array} [data=null] The request body, usually in case of a POST or PUT request.
     * @param {boolean} [includePicnicHeaders=false] If it should include x-picnic-agent and x-picnic-did headers.
     * @param {boolean} [isImageRequest=false] Will add the arrayBuffer response type if true.
     */
    sendRequest(method, path, data = null, includePicnicHeaders = false, isImageRequest = false) {
        return new Promise(async (resolve, reject) => {
            const options = {
                method,
                url: path,
                headers: {
                    "User-Agent": "okhttp/3.12.2",
                    "Content-Type": "application/json; charset=UTF-8",
                    ...(this.authKey && { "x-picnic-auth": this.authKey }),
                    ...(includePicnicHeaders && { "x-picnic-agent": "30100;1.15.77-10293", "x-picnic-did": "3C417201548B2E3B" })
                },
                ...(data && { data }),
                ...(isImageRequest && { responseType: "arraybuffer" })
            };
            try {
                const response = await this.httpInstance.request(options);
                resolve(response.data);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Returns list (string) of all known API routes.
     */
    getKnownApiRoutes() {
        return routes_1.default;
    }
};
//# sourceMappingURL=index.js.map