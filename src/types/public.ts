// Public types, grouped by domain. Consumers reach them through the client class:
//   import type PicnicClient from "picnic-api";
//   type Summary = PicnicClient.Types.delivery.DeliverySummary;
// Grouped by domain because some domains define the same name (e.g. RawReturnedContainer in delivery and payment).

export * as app from "../domains/app/types";
export * as auth from "../domains/auth/types";
export * as cart from "../domains/cart/types";
export * as catalog from "../domains/catalog/types";
export * as checkout from "../domains/checkout/types";
export * as consent from "../domains/consent/types";
export * as customerService from "../domains/customer-service/types";
export * as delivery from "../domains/delivery/types";
export * as payment from "../domains/payment/types";
export * as recipe from "../domains/recipe/types";
export * as user from "../domains/user/types";
export * as common from "./common";
export * as fusion from "../pages/fusion";
export * as pages from "../pages/types";
