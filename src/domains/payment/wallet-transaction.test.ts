import { extractWalletTransaction } from "./wallet-transaction";
import type { RawWalletTransaction } from "./types";

const line = (id: string, articleId: string, extra: Record<string, unknown> = {}) => ({
  type: "ORDER_LINE",
  id,
  price: 398,
  display_price: 398,
  items: [{ type: "ORDER_ARTICLE", id: articleId, name: `Product ${articleId}`, unit_quantity: "500 gram", price: 199, max_count: 50, image_ids: [`image-${articleId}`], decorators: [{ type: "QUANTITY", quantity: 2 }] }],
  ...extra,
});

describe("extractWalletTransaction", () => {
  it("shows substituted products as substitutions instead of lines", () => {
    const transaction = {
      amount_in_cents: 1000,
      delivery_id: "d1",
      payment_execution_timestamp: 1700000000000,
      transaction_type: "PAYMENT",
      transaction_status: "SUCCEEDED",
      payment_option_display_name: "iDEAL",
      payment_option_account: "NL** 0000",
      payment_method_icon_url: "https://example.com/ideal.png",
      shop_items: [line("l1", "s1"), line("l2", "s2")],
      article_issue_refunds: [{ article_id: "s2", quantity: 1, amount: 199, substitutions: [{ name: "Other", image_ids: ["image-s3"], quantity: 1 }] }],
      deposits: [{ value: 25, count: 2 }],
      returned_containers: [{ type: "CRATE", localized_name: "Kratten", quantity: 1, price: 150 }],
    } as unknown as RawWalletTransaction;

    const payment = extractWalletTransaction("t1", transaction);

    expect(payment.items.map((item) => item.productId)).toEqual(["s1"]);
    expect(payment).toMatchObject({
      id: "t1",
      deliveryId: "d1",
      paidAt: 1700000000000,
      amount: 1000,
      substitutions: [{ original: { name: "Product s2", imageId: "image-s2", quantity: 1 }, refundAmount: 199, replacements: [{ name: "Other", imageId: "image-s3", quantity: 1 }] }],
      depositTotal: 50,
      returnedDepositTotal: 150,
      paymentMethod: { displayName: "iDEAL", account: "NL** 0000", iconUrl: "https://example.com/ideal.png" },
    });
  });
});
