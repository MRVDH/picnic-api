import type HttpClient from "../../http-client";
import { PaymentProfile, WalletTransaction, WalletTransactionDetails, WalletTransactionsInput } from "./types";

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
}
