import type HttpClient from "../../http-client";
import { PaymentProfile, WalletTransaction, WalletTransactionDetails } from "./types";
export declare class PaymentService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns payment profile information.
     */
    getPaymentProfile(): Promise<PaymentProfile>;
    /**
     * Returns a page of wallet transactions.
     * @param {number} pageNumber The page number to retrieve (1-based; minimum 1).
     */
    getWalletTransactions(pageNumber: number): Promise<WalletTransaction[]>;
    /**
     * Returns the details of a specific wallet transaction.
     * @param {string} walletTransactionId The id of the transaction.
     */
    getWalletTransactionDetails(walletTransactionId: string): Promise<WalletTransactionDetails>;
}
//# sourceMappingURL=service.d.ts.map