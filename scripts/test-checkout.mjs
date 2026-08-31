#!/usr/bin/env node
/**
 * Manual checkout integration test against live Picnic API.
 *
 * Usage:
 *   PICNIC_AUTH_TOKEN=... COUNTRY_CODE=DE node scripts/test-checkout.mjs
 *   PICNIC_AUTH_TOKEN=... COUNTRY_CODE=DE node scripts/test-checkout.mjs --initiate-only
 *
 * Safety: never calls confirmOrder. With --initiate-only, cancels the transaction after initiate.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const PicnicClient = require("../lib/index.js");
const { isCheckoutIssueError } = require("../lib/errors/checkout-error.js");

const args = new Set(process.argv.slice(2));
const initiateOnly = args.has("--initiate-only");
const dryRun = !initiateOnly;

const token = process.env.PICNIC_AUTH_TOKEN;
const countryCode = process.env.COUNTRY_CODE || "DE";

if (!token) {
  console.error("Set PICNIC_AUTH_TOKEN");
  process.exit(1);
}

const client = new PicnicClient({ countryCode, authKey: token });

function logStep(label, data) {
  console.log(`\n=== ${label} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

try {
  const cart = await client.cart.getCart();
  logStep("Cart", {
    id: cart.id,
    mts: cart.mts,
    total_count: cart.total_count,
    checkout_total_price: cart.checkout_total_price,
    selected_slot: cart.selected_slot,
  });

  if (!cart.selected_slot?.slot_id) {
    console.error("No delivery slot selected — pick a slot in the app or picnic-web first.");
    process.exit(1);
  }

  if (cart.total_count === 0) {
    console.error("Cart is empty.");
    process.exit(1);
  }

  let checkout;
  try {
    checkout = await client.cart.startCheckout({ mts: cart.mts });
  } catch (error) {
    if (isCheckoutIssueError(error)) {
      logStep("Checkout issue", {
        issueType: error.issueType,
        title: error.title,
        message: error.issueMessage,
        resolveKey: error.resolveKey,
        blocking: error.blocking,
      });

      if (error.isAgeVerificationIssue() && error.resolveKey) {
        logStep("Retry with resolve_key", error.resolveKey);
        checkout = await client.cart.startCheckout({
          mts: cart.mts,
          resolve_key: error.resolveKey,
        });
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  logStep("Checkout started", {
    order_id: checkout.order_id,
    total_price: checkout.total_price,
    transaction_expiry: checkout.transaction_expiry,
  });

  if (dryRun) {
    console.log("\nDry run complete — stopped before initiatePayment (no order placed).");
    process.exit(0);
  }

  const payment = await client.cart.initiatePayment(
    checkout.order_id,
    "https://localhost:3000/checkout/return",
  );

  logStep("Payment initiated", {
    payment_id: payment.payment_id,
    transaction_id: payment.transaction_id,
    redirect_url: payment.action?.redirect_url,
  });

  await client.cart.cancelCheckout(payment.transaction_id);
  logStep("Cancelled", "Transaction cancelled — confirmOrder was NOT called.");
} catch (error) {
  console.error("\nCheckout test failed:", error);
  process.exit(1);
}
