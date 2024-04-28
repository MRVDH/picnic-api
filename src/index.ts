import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from "axios";
import md5 from "crypto-js/md5";
import utf8 from "crypto-js/enc-utf8";
import hex from "crypto-js/enc-hex";

import {
  AddProductInput,
  ApiConfig,
  ApiError,
  Article,
  Category,
  ConsentSetting,
  CountryCode,
  CustomerServiceContactInfo,
  Delivery,
  DeliveryPosition,
  DeliveryScenario,
  DeliveryStatus,
  Generate2FACodeInput,
  GetDeliverySlotsResult,
  ImageSize,
  LoginInput,
  LoginResult,
  MgmDetails,
  MyStore,
  Order,
  OrderStatus,
  PaymentProfile,
  ProfileMenu,
  SearchResult,
  SetConsentSettingsInput,
  SetConsentSettingsResult,
  SetDeliverySlotInput,
  SingleArticle,
  SubCategory,
  SuggestionResult,
  User,
  UserInfo,
  Verify2FACodeInput,
  WalletTransaction,
  WalletTransactionDetails,
  WalletTransactionsInput,
} from "./types/picnic-api";

export = class PicnicClient {
  countryCode: CountryCode;
  apiVersion: string;
  authKey: string | null;
  url: string;
  httpInstance: AxiosInstance;

  /**
   * Builds the client that sends the requests.
   * @param {ApiConfig} options To configure the client.
   * @param {string} [options.countryCode=NL] The country code for the requests.
   * @param {string} [options.apiVersion=17] The api version for the requests. Does not seem to do anything yet.
   * @param {string} [options.authKey=null] The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
   * @param {string} [options.url] Custom defined endpoint.
   */
  constructor(options?: ApiConfig) {
    this.countryCode = options?.countryCode || "NL";
    this.apiVersion = options?.apiVersion || "15";
    this.authKey = options?.authKey || null;

    this.url = options?.url || `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;

    this.httpInstance = axios.create({
      baseURL: this.url,
    });
  }

  /**
   * Logs the user into picnic to be able to send requests.
   * @param {string} username The username of the Picnic account.
   * @param {string} password The password of the Picnic account.
   */
  login(username: string, password: string): Promise<LoginResult> {
    return new Promise<LoginResult>(async (resolve, reject) => {
      let secret = md5(utf8.parse(password)).toString(hex);

      try {
        const response = await this.httpInstance.post<LoginInput, AxiosResponse<LoginResult>>(`/user/login`, {
          key: username,
          secret,
          client_id: 30100,
        });

        this.authKey = response.headers[`x-picnic-auth`];

        if (!this.authKey) {
          reject("Login failed: No auth key received.");
        }

        resolve({
          authKey: this.authKey!,
          second_factor_authentication_required: response.data.second_factor_authentication_required,
          show_second_factor_authentication_intro: response.data.show_second_factor_authentication_intro,
          user_id: response.data.user_id,
        });
      } catch (error: any) {
        if (error?.response?.data?.error?.message) {
          reject(`Login failed: ${error.response.data.error.message}`);
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Generates a 2FA code for the user to verify.
   * @param {string} channel The channel to send the code to. Can be 'SMS' or possibly something else.
   */
  generate2FACode(channel: string) {
    return this.sendRequest<Generate2FACodeInput, null>("POST", `/user/2fa/generate`, { channel }, true);
  }

  /**
   * Verifies the 2FA code from the user.
   * @param {string} code The code to verify.
   */
  verify2FACode(code: string) {
    return this.sendRequest<Verify2FACodeInput, null | ApiError>("POST", `/user/2fa/verify`, { otp: code }, true);
  }

  /**
   * Gets the details of the current logged in user.
   */
  getUserDetails(): Promise<User> {
    return this.sendRequest<any, User>("GET", `/user`);
  }

  /**
   * Gets information about the user such as toggled features.
   */
  getUserInfo(): Promise<UserInfo> {
    return this.sendRequest<any, UserInfo>("GET", `/user-info`);
  }

  /**
   * Gets information to display on the profile section.
   */
  getProfileMenu(): Promise<ProfileMenu> {
    return this.sendRequest<any, ProfileMenu>("GET", `/profile-menu?fetch_mgm=true`, null, true);
  }

  /**
   * Searches in picnic products.
   * @param {string} query The keywords to search for.
   */
  async search(query: string): Promise<SearchResult[]> {
    const rawResults = await this.sendRequest<any, any>("GET", `/pages/search-page-results?search_term=${encodeURIComponent(query)}`, null, true);

    const finalResults: SearchResult[] = [];

    for (const child1 of rawResults.body.children) {
      for (const child2 of child1.children) {
        if (child2.content?.selling_unit) {
          finalResults.push(child2.content.selling_unit);
        }
      }
    }

    return finalResults;
  }

  /**
   * returns a suggestion on Picnic products matching the query.
   * @param {string} query The keywords for suggestions.
   */
  getSuggestions(query: string): Promise<SuggestionResult[]> {
    return this.sendRequest<any, SuggestionResult[]>("GET", `/suggest?search_term=${encodeURIComponent(query)}`);
  }

  /**
   * Returns the details of a specific product.
   * @param {string} productId The id of the product to get.
   */
  getArticle(productId: string): Promise<Article> {
    return this.sendRequest<any, Article>("GET", `/articles/${productId}`);
  }

  /**
   * Retreives product images from the server as an arrayBuffer.
   * @param {string} imageId The image id to retreive.
   * @param {ImageSize} size The size of the image to return.
   */
  getImage(imageId: string, size: ImageSize): Promise<string> {
    let alternateRoute = this.url.split("/api/")[0];

    return this.sendRequest<any, string>("GET", `${alternateRoute}/static/images/${imageId}/${size}.png`, null, false, true);
  }

  /**
   * Retreives product images from the server ad a DataUri.
   * @param {string} imageId The image id to retreive.
   * @param {ImageSize} size The size of the image to return.
   */
  async getImageAsDataUri(imageId: string, size: ImageSize): Promise<string> {
    let arrayBuffer = await this.getImage(imageId, size);

    let dataUri = "data:image/png;base64," + Buffer.from(arrayBuffer, "binary").toString("base64");

    return dataUri;
  }

  /**
   * Returns the catgories.
   * @param {number} [depth=0] The category depth of items to retrieve.
   */
  getCategories(depth: number = 0): Promise<MyStore> {
    return this.sendRequest<any, MyStore>("GET", `/my_store?depth=${depth}`);
  }

  /**
   * Returns the shopping cart information of the user and contents.
   */
  getShoppingCart(): Promise<Order> {
    return this.sendRequest<any, Order>("GET", `/cart`);
  }

  /**
   * Adds a product to the shopping cart.
   * @param {string} productId The id of the product to add.
   * @param {number} [count=1] The amount of this product to add.
   */
  addProductToShoppingCart(productId: string, count: number = 1): Promise<Order> {
    return this.sendRequest<AddProductInput, Order>("POST", `/cart/add_product`, { product_id: productId, count } as AddProductInput);
  }

  /**
   * Removes a product from the shopping cart.
   * @param {string} productId The id of the product to remove.
   * @param {number} [count=1] The amount of this product to remove.
   */
  removeProductFromShoppingCart(productId: string, count: number = 1): Promise<Order> {
    return this.sendRequest<AddProductInput, Order>("POST", `/cart/remove_product`, { product_id: productId, count } as AddProductInput);
  }

  /**
   * Clears the shopping cart of the user.
   */
  clearShoppingCart(): Promise<Order> {
    return this.sendRequest<any, Order>("POST", `/cart/clear`);
  }

  /**
   * Get all the delivery slots.
   */
  getDeliverySlots(): Promise<GetDeliverySlotsResult> {
    return this.sendRequest<any, GetDeliverySlotsResult>("GET", `/cart/delivery_slots`);
  }

  /**
   * Selects a delivery slot.
   * @param {string} slotId The id of the delivery slot to be selected.
   */
  setDeliverySlot(slotId: string): Promise<Order> {
    return this.sendRequest<SetDeliverySlotInput, Order>("POST", `/cart/set_delivery_slot`, { slot_id: slotId } as SetDeliverySlotInput);
  }

  /**
   * Returns all past and current deliveries of the user.
   * @param {DeliveryStatus[]} [filter=[]] An array with the statusses of the deliveries to filter on.
   */
  getDeliveries(filter: DeliveryStatus[] = []): Promise<Delivery[]> {
    return this.sendRequest<any, Delivery[]>("POST", `/deliveries/summary`, filter);
  }

  /**
   * Get the details of one specific delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDelivery(deliveryId: string): Promise<Delivery> {
    return this.sendRequest<any, Delivery>("GET", `/deliveries/${deliveryId}`);
  }

  /**
   * Get the position data of one specific delivery. For the route and delivery information, use the scenario call.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDeliveryPosition(deliveryId: string): Promise<DeliveryPosition> {
    return this.sendRequest<any, DeliveryPosition>("GET", `/deliveries/${deliveryId}/position`, null, true);
  }

  /**
   * Get the driver and route information of the delivery.
   * @param {string} deliveryId The id of the delivery to look up.
   */
  getDeliveryScenario(deliveryId: string): Promise<DeliveryScenario> {
    return this.sendRequest<any, DeliveryScenario>("GET", `/deliveries/${deliveryId}/scenario`, null, true);
  }

  /**
   * Cancels the order with the given delivery id.
   * @param {string} deliveryId
   */
  cancelDelivery(deliveryId: string): Promise<any> {
    return this.sendRequest<any, any>("POST", `/order/delivery/${deliveryId}/cancel`);
  }

  /**
   * Sets a rating for the delivery from 0 to 10. Will return 400 if a delivery already has a rating.
   * @param {string} deliveryId
   * @param {number} rating
   */
  setDeliveryRating(deliveryId: string, rating: number): Promise<string> {
    return this.sendRequest<any, string>("POST", `/deliveries/${deliveryId}/rating`, { rating });
  }

  /**
   * (Re)sends the invoice email of the delivery.
   * @param {string} deliveryId
   */
  sendDeliveryInvoiceEmail(deliveryId: string): Promise<string> {
    return this.sendRequest<any, string>("POST", `/deliveries/${deliveryId}/resend_invoice_email`);
  }

  /**
   * Returns the status of the order (not delivery) with the given id.
   * @param {string} orderId
   */
  getOrderStatus(orderId: string): Promise<OrderStatus> {
    return this.sendRequest<any, OrderStatus>("GET", `/cart/checkout/order/${orderId}/status`);
  }

  /**
   * Returns all the lists and sublists.
   * @param {number} [depth=0] The category depth of items to retrieve.
   */
  getLists(depth: number = 0): Promise<Category[]> {
    return this.sendRequest<any, Category[]>("GET", `/lists?depth=${depth}`);
  }

  /**
   * Returns the sublists of a list, the articles of a sublist if the subListId is given.
   * @param {string} listId The id of the list to get.
   * @param {string} [subListId] The id of the sub list to get.
   * @param {number} [depth=0] The category depth of items to retrieve.
   */
  getList(listId: string, subListId?: string, depth: number = 0): Promise<SubCategory[] | SingleArticle[]> {
    let path = `/lists/${listId}`;

    if (subListId) {
      path += `?sublist=${subListId}`;
    }

    path += (subListId ? "&" : "?") + `depth=${depth}`;

    return this.sendRequest<any, SubCategory[] | SingleArticle[]>("GET", path);
  }

  /**
   * Returns the MGM details. This are the friends discount data.
   */
  getMgmDetails(): Promise<MgmDetails> {
    return this.sendRequest<any, MgmDetails>("GET", `/mgm`);
  }

  /**
   * Returns the list of consent settings.
   * @param {boolean} [general=false] Returns only the 'general' consent settings.
   */
  getConsentSettings(general: boolean = false): Promise<ConsentSetting[]> {
    return this.sendRequest<any, ConsentSetting[]>("GET", `/consents${general ? "/general" : ""}/settings-page`);
  }

  /**
   * Sets one or multiple consent options to true or false.
   * @param {SetConsentSettingsInput} consentSettingsInput An array of objects of consent items.
   */
  setConsentSettings(consentSettingsInput: SetConsentSettingsInput): Promise<SetConsentSettingsResult> {
    return this.sendRequest<any, SetConsentSettingsResult>("PUT", `/consents`, consentSettingsInput);
  }

  /**
   * Returns the popup messages in the app. For example, the message after a delivery, asking if the delivery was satisfactory.
   */
  getMessages(): Promise<any> {
    return this.sendRequest<any, any>("GET", `/messages`, null, true);
  }

  /**
   * Returns the reminders.
   */
  getReminders(): Promise<any> {
    return this.sendRequest<any, any>("GET", `/reminders`, null, true);
  }

  /**
   * Gets payment information.
   */
  getPaymentProfile(): Promise<PaymentProfile> {
    return this.sendRequest<any, PaymentProfile>("GET", `/payment-profile`, null, true);
  }

  /**
   * Gets transactions made.
   * @param {number} pageNumber The page number to get the transactions from.
   */
  getWalletTransactions(pageNumber: number): Promise<WalletTransaction[]> {
    return this.sendRequest<WalletTransactionsInput, WalletTransaction[]>("POST", `/wallet/transactions`, { page_number: pageNumber });
  }

  /**
   * Gets payment information.
   * @param {string} walletTransactionId The id of the transaction to get the details from.
   */
  getWalletTransactionDetails(walletTransactionId: string): Promise<WalletTransactionDetails> {
    return this.sendRequest<any, WalletTransactionDetails>("GET", `/wallet/transactions/${walletTransactionId}`);
  }

  /**
   * Gets payment information.
   */
  getCustomerServiceContactInfo(): Promise<CustomerServiceContactInfo> {
    return this.sendRequest<any, CustomerServiceContactInfo>("GET", `/cs-contact-info`, null, true);
  }

  /**
   * Gets parcels.
   * @todo Implement return type once known.
   */
  getParcels(): Promise<any[]> {
    return this.sendRequest<any, any[]>("GET", `/parcels`, null, true);
  }

  /**
   * Can be used to send custom requests that are not implemented but do need authentication for it.
   * @param {string} method The HTTP method to use, such as GET, POST, PUT and DELETE.
   * @param {string} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
   * @param {Object|Array} [data=null] The request body, usually in case of a POST or PUT request.
   * @param {boolean} [includePicnicHeaders=false] If it should include x-picnic-agent and x-picnic-did headers.
   * @param {boolean} [isImageRequest=false] Will add the arrayBuffer response type if true.
   */
  sendRequest<TRequestData = never, TResponseData = AxiosResponse<TRequestData>>(
    method: Method,
    path: string,
    data: Object | null = null,
    includePicnicHeaders: boolean = false,
    isImageRequest: boolean = false
  ): Promise<TResponseData> {
    return new Promise(async (resolve, reject) => {
      const options: AxiosRequestConfig<Object> = {
        method,
        url: path,
        headers: {
          "User-Agent": "okhttp/3.12.2",
          "Content-Type": "application/json; charset=UTF-8",
          ...(this.authKey && { "x-picnic-auth": this.authKey }),
          ...(includePicnicHeaders && { "x-picnic-agent": "30100;1.15.232-15154", "x-picnic-did": "3C417201548B2E3B" }),
        },
        ...(data && { data }),
        ...(isImageRequest && { responseType: "arraybuffer" }),
      };

      try {
        const response = await this.httpInstance.request<TRequestData, AxiosResponse<TResponseData>>(options as AxiosRequestConfig<TRequestData>);
        resolve(response.data);
      } catch (error) {
        reject(error);
      }
    });
  }
};
