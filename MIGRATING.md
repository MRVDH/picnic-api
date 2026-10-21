# Migrating from 4.x to 5.0

Picnic is moving its app from Fusion pages to React Server Components (RSC) pages. Version 5 prepares for
that: the methods return models of what the app shows instead of Picnic's raw responses and pages, so a page
that changes format only changes the library's internals. This guide lists every breaking change with what to
use instead.

## Pages

`app.getPage(pageId)` returns the page in the format Picnic serves it, from one request:

```ts
const page = await client.app.getPage("home_page_root");
if (page.format === "fusion") {
  use(page.page); // FusionPage
} else {
  use(page.content); // RscPageContent: the page's components
}
```

| 4.x | 5.0 |
| --- | --- |
| `app.getPage(id)` returned a `FusionPage` and threw for RSC pages | `app.getPage(id)` returns `{ format: "fusion", page }` or `{ format: "rsc", content }` |
| `app.getRscPageContent(id)` | `app.getPage(id)`, read `content` when `format` is `"rsc"` |
| `catalog.getProductDetailsPage(id)` | `catalog.getProduct(id)`, or `app.getPage("product-details-page-root?id=<id>")` |
| `recipe.getRecipesPage()` | `recipe.getRecipeOverview()`, or `app.getPage("meals-page-root")` |
| `recipe.getCookbookPage()` | `recipe.getUserDefinedRecipes()`, or `app.getPage("cookbook-page-content")` |
| `recipe.getRecipeDetailsPage(id, portions)` | `recipe.getRecipe(id, portions)` |
| `recipe.getUserDefinedRecipeImageSelectionPage(id)` | `recipe.getUserDefinedRecipeSuggestedImages(id)` |

When Picnic serves a page in a format a method doesn't read yet, the method throws an `UnexpectedPageFormatError`
with the page id.

## Models and raw types

Methods return camelCase models under the plain names. Types that mirror Picnic's JSON have a `Raw` prefix when
a model of the same data exists. Types are available as `PicnicClient.Types.<domain>`, e.g.
`PicnicClient.Types.cart.Cart`.

| 4.x type | 5.0 type |
| --- | --- |
| `Cart` (raw) | `RawCart` |
| `CartContents` | `Cart` (now also has `id` and `mts`) |
| `GetDeliverySlotsResult` | `RawDeliverySlots` |
| `DeliverySlot` (raw) | `RawDeliverySlot` |
| `SelectedSlot` (raw) | `RawSelectedSlot` |
| `DeliverySlotOverview` | `DeliverySlots` |
| `DeliverySlotSummary` | `DeliverySlot` |
| `SelectedSlotSummary` | `SelectedDeliverySlot` |
| `Delivery` (raw summary) | `RawDeliverySummary` |
| `DeliveryDetail` (raw) | `RawDelivery` |
| `DeliveryDetails` | `Delivery` |
| `DeliveryOrder` (raw) | `RawDeliveryOrder` |
| `DeliveryOrderDetails` | `DeliveryOrder` |
| `ReturnedContainer` (raw) | `RawReturnedContainer` |
| `ReturnedContainerSummary` | `ReturnedContainer` |
| `DeliveryPosition` (raw) | `RawDeliveryPosition`; `DeliveryPosition` is the new position model |
| `DeliveryScenario` | `RawDeliveryScenario`; see `DeliveryRoute` |
| `WalletTransaction` (list item) | `WalletTransactionSummary` |
| `WalletTransactionDetails` | `RawWalletTransaction` |
| `WalletPayment` | `WalletTransaction` |
| `ProductDetails` | `Product` |
| `RecipeDetails` | `Recipe` |
| `RecipeDetailsOptions` | `RecipeOptions` |
| `UserDefinedRecipeSummary`, `UserDefinedRecipeIngredient`, `UserDefinedRecipeDetails`, `UserDefinedRecipeImageType` | `RecipeSummary`, `RecipeIngredient`, `Recipe`, `RecipeImageType` |
| `SellingGroupSwapType` | `RecipeIngredientSwapType` |
| `BootstrapData` and the tab bar types, in the Fusion types | `RawBootstrapData` and the tab bar types under `PicnicClient.Types.app` |
| `LoginResult` with `user_id`, `second_factor_authentication_required`, `show_second_factor_authentication_intro` | `LoginResult` with `userId`, `secondFactorAuthenticationRequired`, `showSecondFactorAuthenticationIntro` |

Every type that methods return as Picnic's JSON, without a parsing step, has the `Raw` prefix:

| 4.x | 5.0 |
| --- | --- |
| `DeeplinkResolution`, `MessagesWrapper` | `RawDeeplinkResolution`, `RawMessages` |
| `UserSlotMinimumOrderValue` | `RawMinimumOrderValue` |
| `SearchSuggestion` | `RawSearchSuggestion` |
| `CheckoutStartResult`, `InitiatePaymentResult`, `CheckoutStatusResult`, `CheckoutConfirmation`, `OrderStatus` | `RawCheckoutStartResult`, `RawInitiatePaymentResult`, `RawCheckoutStatus`, `RawCheckoutConfirmation`, `RawOrderStatus` |
| `ConsentSetting`, `SetConsentSettingsResult`, `ConsentRequest` | `RawConsentSetting`, `RawSetConsentSettingsResult`, `RawConsentRequest` |
| `CustomerServiceContactInfo` | `RawContactInfo` |
| `Parcel` | `RawParcel` |
| `PaymentProfile` | `RawPaymentProfile` |
| `User`, `UserInfo`, `ProfileMenu`, `UpdateCheckResult` | `RawUser`, `RawUserInfo`, `RawProfileMenu`, `RawUpdateCheckResult` |
| The results of the recipe tasks (`AssignSellingGroupToBasketResult`, `CreateUserDefinedRecipeResult`, ...) | `RawAddRecipeToCartResult`, `RawCreateUserDefinedRecipeResult`, ... |

Fields of Picnic's JSON that the library hasn't typed are `unknown` instead of `any`, so reading them needs a check
or a cast.

The input types of renamed methods follow the method names, e.g. `AssignSellingGroupInput` is
`AddRecipeToCartInput`.

Some types moved to another domain, following their methods:

| 4.x | 5.0 |
| --- | --- |
| `Types.app.RscPageContent`, `Types.app.RscNode` | `Types.pages.RscPageContent`, `Types.pages.RscNode` (with the new `Page` and `PageFormat`) |
| Checkout types in `Types.cart` (`CheckoutStartResult`, `InitiatePaymentResult`, `CheckoutStatusResult`, `CheckoutConfirmation`, `OrderStatus`, ...) | `Types.checkout` |
| `Types.customerService.Message`, `MessagesWrapper`, `MessageDisplayPosition` | `Types.app` |
| `Types.customerService.Parcel`, `Reminder`, `RemindersWrapper` and their parts | `Types.delivery` |

The Fusion page types (`FusionPage`, `PML`, ...) are public as `Types.fusion`.

## Methods

### Cart

| 4.x | 5.0 |
| --- | --- |
| `cart.getCart()` (raw) and `cart.getCartContents()` | `cart.getCart()` returns the `Cart` model |
| `cart.parseCart(rawCart)` | Not needed: `addProductToCart`, `removeProductFromCart`, `clearCart`, `setDeliverySlot` and `removeGroupFromCart` return the `Cart` model |
| `cart.getDeliverySlots()` (raw) and `cart.getDeliverySlotOverview()` | `cart.getDeliverySlots()` returns the `DeliverySlots` model |
| `cart.getBasketFooter()` | `cart.getCartFooter()` |
| `cart.addProductsToCart(products)` | Removed; the app doesn't use this route. Call `addProductToCart` per product |
| `cart.startCheckout`, `initiatePayment`, `getCheckoutStatus`, `cancelCheckout`, `confirmOrder`, `getOrderStatus` | Moved to `client.checkout`, same names |

`checkout.startCheckout` takes camelCase options: `{ mts, resolveKey, outOfStockArticleIds }` instead of
`{ mts, resolve_key, oos_article_ids }`.

The selling unit contexts for `addProductToCart` and `removeProductFromCart` have the field names Picnic uses:
`MealPlanContext` is `{ type: "MEAL_PLAN", day_relative_to_slot, number_of_servings }`, and `SellingGroupContext`
is `{ type: "SELLING_GROUP", selling_group_id, selling_group_creator_type, selling_group_component_id, selling_group_component_type, selling_group_component_swap_type }`.

### Delivery

| 4.x | 5.0 |
| --- | --- |
| `delivery.getDeliveries(filter)` | `delivery.getDeliverySummaries(filter)` |
| `delivery.getDelivery(id)` (raw) and `delivery.getDeliveryDetails(id)` | `delivery.getDelivery(id)` returns the `Delivery` model |
| `delivery.getDeliveryPosition(id)` (raw) | `delivery.getDeliveryPosition(id)` returns the `DeliveryPosition` model |
| `delivery.getDeliveryScenario(id)` | `delivery.getDeliveryRoute(id)` returns the `DeliveryRoute` model |
| `delivery.cancelDelivery`, `setDeliveryRating`, `sendDeliveryInvoiceEmail` returned `any` or `string` | Return `void` |
| `delivery.parseTracking(position, scenario)` | `delivery.getDeliveryTracking(id, knownRoute)`: pass the `route` of the previous result, and the route is only fetched again when its version changes |
| `customerService.getParcels()` | `delivery.getParcels()` |
| `customerService.getReminders()`, `setReminders()` | Removed: Picnic answers the reminders route with 204 No Content and the app has no reminders screen |

`DeliveryTracking` nests the route: `tracking.route.points`, `tracking.route.driverName` and so on, with
`tracking.routeVersion` instead of `scenarioVersion`.

### Payment, catalog, user and app

| 4.x | 5.0 |
| --- | --- |
| `payment.getWalletTransactionDetails(id)` and `payment.getWalletPayment(id)` | `payment.getWalletTransaction(id)` returns the `WalletTransaction` model |
| `catalog.getProductDetails(id)` | `catalog.getProduct(id)` |
| `catalog.getImage(id, size)` typed as a string | Returns an `ArrayBuffer` |
| `user.getUserDetails()` | `user.getUser()` |
| `customerService.getMessages(positions)` | `app.getMessages(positions)` |
| `client.userOnboarding` | Removed |
| `consent.getConsentSettings(true)` | `consent.getGeneralConsentSettings()`; `getConsentSettings()` takes no argument |
| `user.submitSuggestion(text)` returned `any` | Returns `void` |
| `user.registerPushToken(token, platform)` sent `{ push_token, platform }` | `user.registerPushToken(token)` sends `{ push_destination, push_version: 1 }`, as the app does, and returns `void` |

### Recipes

| 4.x | 5.0 |
| --- | --- |
| `recipe.getRecipe(id, portions, { resolveIngredientNames })` and `recipe.getUserDefinedRecipe(...)` | `recipe.getRecipe(id, { portions, resolveIngredientNames })` |
| `recipe.assignSellingGroupToBasket(id, dayOffset, portions)` | `recipe.addRecipeToCart(id, { dayOffset, portions })` |
| `recipe.updateSellingGroupPortions(id, dayOffset, portions)` | `recipe.updateRecipePortionsInCart(id, { dayOffset, portions })` |
| `recipe.removeSellingGroupFromBasket(id)` | `recipe.removeRecipeFromCart(id)` |
| `recipe.updateUserDefinedRecipeIngredient(id, ingredientId, quantities, portions, swapType)` | `recipe.updateRecipeIngredient(id, ingredientId, { quantities, portions, swapType })`; works for catalog recipes too |
| `recipe.assignSellableComponentToDay(id, ingredientId, quantities, portions, swapType)` | `recipe.updateRecipeIngredientInCart(id, ingredientId, { quantities, portions, swapType })` |
| `recipe.removeUserDefinedRecipeIngredient(id, ingredientId)` | `recipe.removeRecipeIngredient(id, ingredientId)` |
| `recipe.addUserDefinedRecipeIngredient(id, sellingUnitId, quantity, portions, order)` | `recipe.addUserDefinedRecipeIngredient(id, sellingUnitId, { quantity, portions, order })` |
| Recipe methods that returned `Record<string, never>` (`saveRecipe`, `renameUserDefinedRecipe`, ...) | Return `void` |

## Errors

An error status throws a `PicnicApiError` (also on `PicnicClient.PicnicApiError`) with the HTTP `status`,
Picnic's error `code` and the response `body`. Check those instead of the message: a wrong password is a 401 with
code `AUTH_INVALID_CRED`, a wrong 2FA code a 400 with code `OTP_NOT_VALID`.

```ts
try {
  await client.auth.login(email, password);
} catch (error) {
  if (PicnicClient.isPicnicApiError(error) && error.code === "AUTH_INVALID_CRED") {
    // wrong email or password
  }
}
```

`login` and `verify2FACode` no longer prefix their messages with `Login failed:` and `2FA verification failed:`.
`CheckoutIssueError` and `UnexpectedPageFormatError` are unchanged, apart from the message of the latter.

## Custom requests

The fourth argument of `sendRequest` is an options object:

| 4.x | 5.0 |
| --- | --- |
| `sendRequest(method, path, data, true)` | `sendRequest(method, path, data, { includePicnicHeaders: true })` |
| `sendRequest(method, path, null, false, true)` | `sendRequest(method, path, null, { binary: true })` |
| `sendRequest(method, path, body, true, false, "image/jpeg")` | `sendRequest(method, path, body, { includePicnicHeaders: true, contentType: "image/jpeg" })` |

Passing a boolean throws a `TypeError`. `sendRequestWithHeaders` takes the same options and also returns the
response headers.
