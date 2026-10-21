import type HttpClient from "../../http-client";
import { PaymentProfile, WalletTransaction, WalletTransactionSummary, RawWalletTransaction, WalletTransactionsInput } from "./types";
import { extractWalletTransaction } from "./wallet-transaction";

export class PaymentService {
  constructor(private http: HttpClient) {}

  /**
   * Returns payment profile information.
   */
  getPaymentProfile(): Promise<PaymentProfile> {
    return this.http.sendRequest<any, PaymentProfile>("GET", `/payment-profile`, null, { includePicnicHeaders: true });
  }

  /**
   * Returns a page of wallet transactions.
   * @param {number} pageNumber The page number to retrieve (1-based; minimum 1).
   */
  getWalletTransactions(pageNumber: number): Promise<WalletTransactionSummary[]> {
    return this.http.sendRequest<WalletTransactionsInput, WalletTransactionSummary[]>("POST", `/wallet/transactions`, { page_number: pageNumber });
  }

  /**
   * Returns a payment (or refund) as the app's wallet shows it: the amount, the order lines it
   * covers (read like the cart's), the substituted products, deposits and the payment method.
   * @param {string} walletTransactionId The id of the transaction.
   */
  async getWalletTransaction(walletTransactionId: string): Promise<WalletTransaction> {
    const raw = await this.http.sendRequest<null, RawWalletTransaction>("GET", `/wallet/transactions/${encodeURIComponent(walletTransactionId)}`);
    return extractWalletTransaction(walletTransactionId, raw);
  }
}
