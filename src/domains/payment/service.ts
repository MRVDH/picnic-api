import type HttpClient from "../../http-client";
import { PaymentProfile, WalletPayment, WalletTransaction, WalletTransactionDetails, WalletTransactionsInput } from "./types";
import { extractWalletPayment } from "./transaction";

export class PaymentService {
  constructor(private http: HttpClient) {}

  /**
   * Returns payment profile information.
   */
  getPaymentProfile(): Promise<PaymentProfile> {
    return this.http.sendRequest<any, PaymentProfile>("GET", `/payment-profile`, null, true);
  }

  /**
   * Returns a page of wallet transactions.
   * @param {number} pageNumber The page number to retrieve (1-based; minimum 1).
   */
  getWalletTransactions(pageNumber: number): Promise<WalletTransaction[]> {
    return this.http.sendRequest<WalletTransactionsInput, WalletTransaction[]>("POST", `/wallet/transactions`, { page_number: pageNumber });
  }

  /**
   * Returns the details of a specific wallet transaction.
   * @param {string} walletTransactionId The id of the transaction.
   */
  getWalletTransactionDetails(walletTransactionId: string): Promise<WalletTransactionDetails> {
    return this.http.sendRequest<any, WalletTransactionDetails>("GET", `/wallet/transactions/${walletTransactionId}`);
  }

  /**
   * Returns a payment (or refund) as the app's wallet shows it: the amount, the order lines it
   * covers (read like the cart's), the substituted products, deposits and the payment method.
   * @param {string} walletTransactionId The id of the transaction.
   */
  async getWalletPayment(walletTransactionId: string): Promise<WalletPayment> {
    return extractWalletPayment(walletTransactionId, await this.getWalletTransactionDetails(walletTransactionId));
  }
}
