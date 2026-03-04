"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
class PaymentService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns payment profile information.
     */
    getPaymentProfile() {
        return this.http.sendRequest("GET", `/payment-profile`, null, true);
    }
    /**
     * Returns a page of wallet transactions.
     * @param {number} pageNumber The page number to retrieve (1-based; minimum 1).
     */
    getWalletTransactions(pageNumber) {
        return this.http.sendRequest("POST", `/wallet/transactions`, { page_number: pageNumber });
    }
    /**
     * Returns the details of a specific wallet transaction.
     * @param {string} walletTransactionId The id of the transaction.
     */
    getWalletTransactionDetails(walletTransactionId) {
        return this.http.sendRequest("GET", `/wallet/transactions/${walletTransactionId}`);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=service.js.map