import axios from "axios";
import md5 from "crypto-js/md5.js";
import utf8 from "crypto-js/enc-utf8.js";
import hex from "crypto-js/enc-hex.js";

import routes from "./routes.js";

/**
 * Country codes for the Picnic requests.
 */
export const CountryCodes = {
    NL: "NL",
    DE: "DE"
}

export const HttpMethods = {
    GET: "get",
    HEAD: "head",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
    CONNECT: "connect",
    OPTIONS: "options",
    TRACE: "trace",
    PATCH: "patch"
}

class PicnicClient {
    /**
     * Builds the client that sends the requests.
     * @param {Object} options To configure the client.
     * @param {String} [options.countryCode=NL] The country code for the requests.
     * @param {String} [options.apiVersion=15] The api version for the requests. Does not seem to do anything yet.
     * @param {String} [options.authKey=null] The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
     */
    constructor(options = { }) {
        this.countryCode = options.countryCode || CountryCodes.NL;
        this.apiVersion = options.apiVersion || "1000";
        this.authKey = options.authKey || null;

        this.url = `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;

        this._configureHttpInstance();
    }

    /**
     * Builds the axios instance that is used to send the requests.
     */
    _configureHttpInstance () {
        // Creates the http client and adds the necessary headers.
        this.httpInstance = axios.create({
            baseURL: this.url,
            headers: {
                "User-Agent": "okhttp/3.9.0",
                "Content-Type": "application/json; charset=UTF-8"
            }
        });

        // Adds the auth key to every requests.
        this.httpInstance.interceptors.request.use((config) => {
            if (this.authKey) {
                config.headers["x-picnic-auth"] = this.authKey;
            }

            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }

    /**
     * Logs the user into picnic to be able to send requests.
     * @param {String} username The username of the Picnic account.
     * @param {String} password The password of the Picnic account.
     * @returns {Promise} Empty response if successful, otherwise an error.
     */
    login (username, password) {
        return new Promise((resolve, reject) => {
            let secret = md5(utf8.parse(password)).toString(hex);

            this.httpInstance.post(`/user/login`, {
                key: username,
                secret,
                client_id: 1
            }).then(res => {
                this.authKey = res.headers[`x-picnic-auth`];
                resolve();
            }).catch(err => {
                if (err && err.response && err.response.data && err.response.data.error && err.response.data.error.message) {
                    reject(`Login failed: ${err.response.data.error.message}`);
                } else {
                    reject(err);
                }
            });
        });
    }

    /**
     * Gets the details of the current logged in user.
     */
    getUserDetails () {
        return this.sendRequest(HttpMethods.GET, `/user`);
    }

    /**
     * Searches in picnic products.
     * @param {String} query The keywords to search for. 
     */
    search (query) {
        return this.sendRequest(HttpMethods.GET, `/search?search_term=${encodeURIComponent(query)}`);
    }

    /**
     * returns a suggestion on Picnic products matching the query.
     * @param {String} query The keywords for suggestions. 
     */
    getSuggestions (query) {
        return this.sendRequest(HttpMethods.GET, `/suggest?search_term=${encodeURIComponent(query)}`);
    }

    /**
     * Returns the detials of a specific product.
     * @param {String} productId The id of the product to get. 
     */
    getProduct (productId) {
        return this.sendRequest(HttpMethods.GET, `/product/${productId}`);
    }

    /**
     * Returns the catgories.
     * @param {Number} depth The depth of cagetories to retrieve.
     */
    getCategories (depth = 0) {
        return this.sendRequest(HttpMethods.GET, `/my_store?depth=${depth}`);
    }

    /**
     * Returns the shopping cart information of the user and contents.
     */
    getShoppingCart () {
        return this.sendRequest(HttpMethods.GET, `/cart`);
    }

    /**
     * Adds a product to the shopping cart.
     * @param {String} productId The id of the product to add.
     * @param {Number} [count=1] The amount of this product to add. 
     */
    addProductToShoppingCart (productId, count = 1) {
        return this.sendRequest(HttpMethods.POST, `/cart/add_product`, { product_id: productId, count });
    }

    /**
     * Removes a product from the shopping cart.
     * @param {String} productId The id of the product to remove.
     * @param {Number} [count=1] The amount of this product to remove. 
     */
    removeProductFromShoppingCart (productId, count = 1) {
        return this.sendRequest(HttpMethods.POST, `/cart/remove_product`, { product_id: productId, count });
    }

    /**
     * Clears the shopping cart of the user.
     */
    clearShoppingCart () {
        return this.sendRequest(HttpMethods.POST, `/cart/clear`);
    }

    /**
     * Get all the delivery slots.
     */
    getDeliverySlots () {
        return this.sendRequest(HttpMethods.GET, `/cart/delivery_slots`);
    }

    /**
     * Selects a delivery slot.
     * @param {String} slotId The id of the delivery slot to be selected.
     */
    setDeliverySlot (slotId) {
        return this.sendRequest(HttpMethods.POST, `/cart/set_delivery_slot`, { slot_id: slotId });
    }

    /**
     * Returns all past and current deliveries of the user. 
     * @param {Boolean} [summary=false] Return a summary (less data).
     * @param {Array} [filter=[]] An array with the statusses of the deliveries. For example; ['COMPLETED'] will only get completed deliveries. Possible options include CURRENT, COMPLETED and CANCELLED.
     */
    getDeliveries (summary = false, filter = []) {
        return this.sendRequest(HttpMethods.POST, `/deliveries${summary ? `/summary` : `` }`, filter);
    }

    /**
     * Get the details of one specific delivery.
     * @param {String} deliveryId The id of the delivery to look up.
     */
    getDelivery (deliveryId) {
        return this.sendRequest(HttpMethods.GET, `/deliveries/${deliveryId}`);
    }

    /**
     * Get the position of one specific delivery. Only works on deliveries on the way.
     * @param {String} deliveryId The id of the delivery to look up.
     */
    getDeliveryPosition (deliveryId) {
        return this.sendRequest(HttpMethods.GET, `/deliveries/${deliveryId}/position`);
    }

    /**
     * Cancels the order with the given delivery id.
     * @param {String} deliveryId 
     */
    cancelDelivery (deliveryId) {
        return this.sendRequest(HttpMethods.POST, `/order/delivery/${deliveryId}/cancel`);
    }

    /**
     * Sets a rating for the delivery from 0 to 10. Will return 400 if a delivery already has a rating. 
     * @param {String} deliveryId 
     * @param {Number} rating 
     */
    setDeliveryRating (deliveryId, rating) {
        return this.sendRequest(HttpMethods.POST, `/deliveries/${deliveryId}/rating`, { rating });
    }

    /**
     * (Re)sends the invoice email of the delivery.
     * @param {String} deliveryId 
     */
    sendDeliveryInvoiceEmail (deliveryId) {
        return this.sendRequest(HttpMethods.POST, `/deliveries/${deliveryId}/resend_invoice_email`);
    }

    /**
     * Returns the status of the order (not delivery) with the given id.
     * @param {String} orderId 
     */
    getOrderStatus (orderId) {
        return this.sendRequest(HttpMethods.GET, `/cart/checkout/order/${orderId}/status`);
    }

    /**
     * Returns all the lists and sublists.
     */
    getLists () {
        return this.sendRequest(HttpMethods.GET, `/lists`);
    }

    /**
     * Returns the list and its sublists, or a specific sublist if the id is given.
     * @param {String} listId The id of the list to get.
     * @param {String} [subListId] The id of the sub list to get.
     */
    getList (listId, subListId) {
        return this.sendRequest(HttpMethods.GET, `/lists/${listId}${subListId ? `?sublist=${subListId}` : ``}`);
    }

    /**
     * Returns the MGM details. This are the friends discount data. 
     */
    getMgmDetails () {
        return this.sendRequest(HttpMethods.GET, `/mgm`);
    }
    
    /**
     * Returns the list of consent settings.
     * @param {Boolean} [general] Returns only the 'general' consent settings.
     */
    getConsentSettings (general = false) {
        return this.sendRequest(HttpMethods.GET, `/consents${general ? '/general' : ''}/settings-page`);
    }
    
    /**
     * Sets one or multiple consent options to true or false.
     * @param {{consent_request_text_id: String, consent_request_locale: String, agreement: Boolean}[]} consentDeclarations An array of objects of consent items. Example: [ { consent_request_text_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', consent_request_locale: 'nl_NL', agreement: false } ]
     */
    setConsentSettings (consentDeclarations) {
        return this.sendRequest(HttpMethods.PUT, `/consents`, { consent_declarations: consentDeclarations });
    }

    /**
     * Can be used to send custom requests that are not implemented but do need authentication for it.
     * @param {String} method The HTTP method to use, such as GET, POST, PUT and DELETE.
     * @param {String} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
     * @param {Object|Array} data The request body, usually in case of a POST or PUT request.
     */
    sendRequest (method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                method,
                url: path,
            };
    
            if (data) {
                options.data = data;
            }
    
            this.httpInstance.request(options).then(res => {
                resolve(res.data);
            }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Returns list (string) of all known API routes.
     */
    getKnownApiRoutes () {
        return routes;
    }
}

export default PicnicClient;