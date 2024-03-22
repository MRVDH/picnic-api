import { AxiosInstance, AxiosResponse, Method } from "axios";
import { ApiConfig, Article, Category, ConsentSetting, CountryCode, Delivery, DeliveryPosition, DeliveryScenario, DeliveryStatus, GetDeliverySlotsResult, ImageSize, LoginResult, MgmDetails, MyStore, Order, OrderStatus, SearchResult, SetConsentSettingsInput, SetConsentSettingsResult, SingleArticle, SubCategory, SuggestionResult, User } from "./types/picnic-api";
declare const _default: {
    new (options?: ApiConfig | undefined): {
        countryCode: CountryCode;
        apiVersion: string;
        authKey: string | null;
        url: string;
        httpInstance: AxiosInstance;
        /**
         * Logs the user into picnic to be able to send requests.
         * @param {string} username The username of the Picnic account.
         * @param {string} password The password of the Picnic account.
         */
        login(username: string, password: string): Promise<LoginResult>;
        /**
         * Gets the details of the current logged in user.
         */
        getUserDetails(): Promise<User>;
        /**
         * Searches in picnic products.
         * @param {string} query The keywords to search for.
         */
        search(query: string): Promise<SearchResult[]>;
        /**
         * returns a suggestion on Picnic products matching the query.
         * @param {string} query The keywords for suggestions.
         */
        getSuggestions(query: string): Promise<SuggestionResult[]>;
        /**
         * Returns the details of a specific product.
         * @param {string} productId The id of the product to get.
         */
        getArticle(productId: string): Promise<Article>;
        /**
         * Retreives product images from the server as an arrayBuffer.
         * @param {string} imageId The image id to retreive.
         * @param {ImageSize} size The size of the image to return.
         */
        getImage(imageId: string, size: ImageSize): Promise<string>;
        /**
         * Retreives product images from the server ad a DataUri.
         * @param {string} imageId The image id to retreive.
         * @param {ImageSize} size The size of the image to return.
         */
        getImageAsDataUri(imageId: string, size: ImageSize): Promise<string>;
        /**
         * Returns the catgories.
         * @param {number} [depth=0] The category depth of items to retrieve.
         */
        getCategories(depth?: number): Promise<MyStore>;
        /**
         * Returns the shopping cart information of the user and contents.
         */
        getShoppingCart(): Promise<Order>;
        /**
         * Adds a product to the shopping cart.
         * @param {string} productId The id of the product to add.
         * @param {number} [count=1] The amount of this product to add.
         */
        addProductToShoppingCart(productId: string, count?: number): Promise<Order>;
        /**
         * Removes a product from the shopping cart.
         * @param {string} productId The id of the product to remove.
         * @param {number} [count=1] The amount of this product to remove.
         */
        removeProductFromShoppingCart(productId: string, count?: number): Promise<Order>;
        /**
         * Clears the shopping cart of the user.
         */
        clearShoppingCart(): Promise<Order>;
        /**
         * Get all the delivery slots.
         */
        getDeliverySlots(): Promise<GetDeliverySlotsResult>;
        /**
         * Selects a delivery slot.
         * @param {string} slotId The id of the delivery slot to be selected.
         */
        setDeliverySlot(slotId: string): Promise<Order>;
        /**
         * Returns all past and current deliveries of the user.
         * @param {DeliveryStatus[]} [filter=[]] An array with the statusses of the deliveries to filter on.
         */
        getDeliveries(filter?: DeliveryStatus[]): Promise<Delivery[]>;
        /**
         * Get the details of one specific delivery.
         * @param {string} deliveryId The id of the delivery to look up.
         */
        getDelivery(deliveryId: string): Promise<Delivery>;
        /**
         * Get the position data of one specific delivery. For the route and delivery information, use the scenario call.
         * @param {string} deliveryId The id of the delivery to look up.
         */
        getDeliveryPosition(deliveryId: string): Promise<DeliveryPosition>;
        /**
         * Get the driver and route information of the delivery.
         * @param {string} deliveryId The id of the delivery to look up.
         */
        getDeliveryScenario(deliveryId: string): Promise<DeliveryScenario>;
        /**
         * Cancels the order with the given delivery id.
         * @param {string} deliveryId
         */
        cancelDelivery(deliveryId: string): Promise<any>;
        /**
         * Sets a rating for the delivery from 0 to 10. Will return 400 if a delivery already has a rating.
         * @param {string} deliveryId
         * @param {number} rating
         */
        setDeliveryRating(deliveryId: string, rating: number): Promise<string>;
        /**
         * (Re)sends the invoice email of the delivery.
         * @param {string} deliveryId
         */
        sendDeliveryInvoiceEmail(deliveryId: string): Promise<string>;
        /**
         * Returns the status of the order (not delivery) with the given id.
         * @param {string} orderId
         */
        getOrderStatus(orderId: string): Promise<OrderStatus>;
        /**
         * Returns all the lists and sublists.
         * @param {number} [depth=0] The category depth of items to retrieve.
         */
        getLists(depth?: number): Promise<Category[]>;
        /**
         * Returns the sublists of a list, the articles of a sublist if the subListId is given.
         * @param {string} listId The id of the list to get.
         * @param {string} [subListId] The id of the sub list to get.
         * @param {number} [depth=0] The category depth of items to retrieve.
         */
        getList(listId: string, subListId?: string | undefined, depth?: number): Promise<SubCategory[] | SingleArticle[]>;
        /**
         * Returns the MGM details. This are the friends discount data.
         */
        getMgmDetails(): Promise<MgmDetails>;
        /**
         * Returns the list of consent settings.
         * @param {boolean} [general=false] Returns only the 'general' consent settings.
         */
        getConsentSettings(general?: boolean): Promise<ConsentSetting[]>;
        /**
         * Sets one or multiple consent options to true or false.
         * @param {SetConsentSettingsInput} consentSettingsInput An array of objects of consent items.
         */
        setConsentSettings(consentSettingsInput: SetConsentSettingsInput): Promise<SetConsentSettingsResult>;
        /**
         * Returns the popup messages in the app. For example, the message after a delivery, asking if the delivery was satisfactory.
         */
        getMessages(): Promise<any>;
        /**
         * Returns the reminders.
         */
        getReminders(): Promise<any>;
        /**
         * Can be used to send custom requests that are not implemented but do need authentication for it.
         * @param {string} method The HTTP method to use, such as GET, POST, PUT and DELETE.
         * @param {string} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
         * @param {Object|Array} [data=null] The request body, usually in case of a POST or PUT request.
         * @param {boolean} [includePicnicHeaders=false] If it should include x-picnic-agent and x-picnic-did headers.
         * @param {boolean} [isImageRequest=false] Will add the arrayBuffer response type if true.
         */
        sendRequest<TRequestData = never, TResponseData = AxiosResponse<TRequestData, any>>(method: Method, path: string, data?: Object | null, includePicnicHeaders?: boolean, isImageRequest?: boolean): Promise<TResponseData>;
        /**
         * Returns list (string) of all known API routes.
         */
        getKnownApiRoutes(): string;
    };
};
export = _default;
//# sourceMappingURL=index.d.ts.map