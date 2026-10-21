import type HttpClient from "../../http-client";
import type {
  CancelCheckoutInput,
  RawCheckoutConfirmation,
  CheckoutStartInput,
  RawCheckoutStartResult,
  RawCheckoutStatus,
  InitiatePaymentInput,
  RawInitiatePaymentResult,
  RawOrderStatus,
  StartCheckoutOptions,
} from "./types";

/** Checking out the cart: starting the checkout, paying, and confirming the order. */
export class CheckoutService {
  constructor(private http: HttpClient) {}

  /**
   * Starts the checkout of the current cart and returns the order to pay for.
   * @param {StartCheckoutOptions} options The cart's `mts`, and what the user resolved or accepted.
   * @throws {CheckoutIssueError} When the cart has issues to resolve first, e.g. an age check for alcohol.
   */
  startCheckout(options: StartCheckoutOptions): Promise<RawCheckoutStartResult> {
    return this.http.sendRequest<CheckoutStartInput, RawCheckoutStartResult>(
      "POST",
      `/cart/checkout/start`,
      {
        mts: options.mts,
        oos_article_ids: options.outOfStockArticleIds ?? null,
        ...(options.resolveKey ? { resolve_key: options.resolveKey } : {}),
      },
      { includePicnicHeaders: true },
    );
  }

  /**
   * Initiates payment for a checkout order and returns a bank redirect URL.
   */
  initiatePayment(orderId: string, appReturnUrl: string): Promise<RawInitiatePaymentResult> {
    const body: InitiatePaymentInput = {
      order_id: orderId,
      app_return_url: appReturnUrl,
    };
    return this.http.sendRequest<InitiatePaymentInput, RawInitiatePaymentResult>(
      "POST",
      `/cart/checkout/initiate_payment`,
      body,
      { includePicnicHeaders: true },
    );
  }

  /**
   * Polls checkout payment status while a transaction is in progress.
   */
  getCheckoutStatus(transactionId: string): Promise<RawCheckoutStatus> {
    return this.http.sendRequest<void, RawCheckoutStatus>(
      "GET",
      `/cart/checkout/${encodeURIComponent(transactionId)}/status`,
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
      { includePicnicHeaders: true },
    );
  }
  /**
   * Confirms and places an order identified by its order id.
   * @param {string} orderId The id of the order to confirm.
   */
  confirmOrder(orderId: string): Promise<RawCheckoutConfirmation> {
    return this.http.sendRequest<void, RawCheckoutConfirmation>("POST", `/cart/checkout/order/${encodeURIComponent(orderId)}/confirm`);
  }

  /**
   * Returns the status of an order (not delivery) by its id.
   * @param {string} orderId
   */
  getOrderStatus(orderId: string): Promise<RawOrderStatus> {
    return this.http.sendRequest<null, RawOrderStatus>("GET", `/cart/checkout/order/${encodeURIComponent(orderId)}/status`);
  }
}
