"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const crypto_1 = __importDefault(require("crypto"));
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
        this.apiVersion = options?.apiVersion || "15";
        this.authKey = options?.authKey || null;
        this.url = options?.url || `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;
    }
    /**
     * Logs the user into picnic to be able to send requests.
     * @param {string} username The username of the Picnic account.
     * @param {string} password The password of the Picnic account.
     */
    async login(username, password) {
        const secret = crypto_1.default.createHash("md5").update(password, "utf8").digest("hex");
        const response = await fetch(`${this.url}/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: username,
                secret,
                client_id: 30100,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Login failed: ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        this.authKey = response.headers.get(`x-picnic-auth`);
        if (!this.authKey) {
            throw new Error("Login failed: No auth key received.");
        }
        return {
            authKey: this.authKey,
            second_factor_authentication_required: data.second_factor_authentication_required,
            show_second_factor_authentication_intro: data.show_second_factor_authentication_intro,
            user_id: data.user_id,
        };
    }
    /**
     * Generates a 2FA code for the user to verify.
     * @param {string} channel The channel to send the code to. Can be 'SMS' or possibly something else.
     */
    generate2FACode(channel) {
        return this.sendRequest("POST", `/user/2fa/generate`, { channel }, true);
    }
    /**
     * Verifies the 2FA code from the user.
     * @param {string} code The code to verify.
     */
    verify2FACode(code) {
        return this.sendRequest("POST", `/user/2fa/verify`, { otp: code }, true);
    }
    /**
     * Gets the details of the current logged in user.
     */
    getUserDetails() {
        return this.sendRequest("GET", `/user`);
    }
    /**
     * Gets information about the user such as toggled features.
     */
    getUserInfo() {
        return this.sendRequest("GET", `/user-info`);
    }
    /**
     * Gets information to display on the profile section.
     */
    getProfileMenu() {
        return this.sendRequest("GET", `/profile-menu?fetch_mgm=true`, null, true);
    }
    /**
     * Searches in picnic products.
     * @param {string} query The keywords to search for.
     */
    async search(query) {
        const exploreChildren = (children) => {
            const ret = [];
            for (const child of children) {
                if (child.children) {
                    ret.push(...exploreChildren(child.children));
                }
                if (child.content?.sellingUnit) {
                    ret.push(child.content.sellingUnit);
                }
            }
            return ret;
        };
        const rawResults = await this.sendRequest("GET", `/pages/search-page-results?search_term=${encodeURIComponent(query)}`, null, true);
        return exploreChildren(rawResults.body.child.children);
    }
    async getBundleArticleIds(soleArticleId) {
        try {
            const response = await this.sendRequest("GET", `/pages/bundle-overview-page?sole_article_id=${soleArticleId}&show_category_action=true`, null, true);
            if (!response.body) {
                return [];
            }
            const articleIdMatches = Array.from(JSON.stringify(response.body).matchAll(/"product-page-bundle-item-(s[0-9]+)"/g)).map((match) => match[1]);
            const uniqueArticleIds = [...new Set(articleIdMatches)];
            return uniqueArticleIds;
        }
        catch (error) {
            throw new Error("Failed to parse the results and find the article id. This could mean that the response format from the picnic servers has changed. Please open an issue on the github repository.");
        }
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
        let dataUri = "data:image/png;base64," + Buffer.from(arrayBuffer, "binary").toString("base64");
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
        path += (subListId ? "&" : "?") + `depth=${depth}`;
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
        return this.sendRequest("GET", `/consents${general ? "/general" : ""}/settings-page`);
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
     * Gets payment information.
     */
    getPaymentProfile() {
        return this.sendRequest("GET", `/payment-profile`, null, true);
    }
    /**
     * Gets transactions made.
     * @param {number} pageNumber The page number to get the transactions from.
     */
    getWalletTransactions(pageNumber) {
        return this.sendRequest("POST", `/wallet/transactions`, { page_number: pageNumber });
    }
    /**
     * Gets payment information.
     * @param {string} walletTransactionId The id of the transaction to get the details from.
     */
    getWalletTransactionDetails(walletTransactionId) {
        return this.sendRequest("GET", `/wallet/transactions/${walletTransactionId}`);
    }
    /**
     * Gets payment information.
     */
    getCustomerServiceContactInfo() {
        return this.sendRequest("GET", `/cs-contact-info`, null, true);
    }
    /**
     * Gets parcels.
     * @todo Implement return type once known.
     */
    getParcels() {
        return this.sendRequest("GET", `/parcels`, null, true);
    }
    /**
     * Can be used to send custom requests that are not implemented but do need authentication for it.
     * @param {string} method The HTTP method to use, such as GET, POST, PUT and DELETE.
     * @param {string} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
     * @param {TRequestData|null} [data=null] The request body, usually in case of a POST or PUT request.
     * @param {boolean} [includePicnicHeaders=false] If it should include x-picnic-agent and x-picnic-did headers.
     * @param {boolean} [isImageRequest=false] Will add the arrayBuffer response type if true.
     */
    async sendRequest(method, path, data = null, includePicnicHeaders = false, isImageRequest = false) {
        const headers = new Headers({
            "User-Agent": "okhttp/3.12.2",
            "Content-Type": "application/json; charset=UTF-8",
            ...(this.authKey && { "x-picnic-auth": this.authKey }),
            ...(includePicnicHeaders && { "x-picnic-agent": "30100;1.15.232-15154", "x-picnic-did": "3C417201548B2E3B" }),
        });
        const response = await fetch(`${this.url}${path}`, {
            method: method,
            headers: headers,
            body: data ? JSON.stringify(data) : null,
        });
        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(`${errorData.error?.message || response.statusText}`);
            }
            catch (e) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        }
        return isImageRequest ? response.arrayBuffer() : response.json();
    }
};
//# sourceMappingURL=index.js.map