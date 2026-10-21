# Picnic-API

[![npm version](https://img.shields.io/npm/v/picnic-api.svg?style=flat-square)](https://www.npmjs.org/package/picnic-api) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-api/blob/master/LICENSE) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

Unofficial Node.js wrapper for the API of the [Picnic](https://picnic.app) online supermarket. Not affiliated with Picnic.

## Installation

```bash
npm install picnic-api
```

## Quick start

Import the package and create a client. All configuration options are optional.

```ts
import PicnicClient from "picnic-api";

const picnicClient = new PicnicClient({
  countryCode: "NL", // The country code for the API. Options: "NL" (default), "DE" or "FR".
  authKey: "...",    // An existing auth key to skip the login step.
  apiVersion: "15",  // The API version (defaults to "15").
  url: "...",        // A custom base URL (defaults to https://storefront-prod.<countryCode>.picnicinternational.com/api/<apiVersion>).
  deviceId: "...",   // Custom device identifier for x-picnic-did header. (defaults to "3C417201548B2E3B")
  agent: "...",      // Custom agent string for x-picnic-agent header. (defaults to a recent app version)
});
```

### Authentication

Most endpoints require authentication. Call `auth.login()` to obtain an auth key, which is automatically stored in the client and sent with subsequent requests. If you already have a key from a previous session, pass it as `authKey` in the constructor instead.

If the login endpoint responds with a 2FA requirement (`second_factor_authentication_required: true`), then call `auth.generate2FACode("SMS")` to generate a 2FA code and pass it to `auth.verify2FA(<code>)` to complete the login process.

```ts
await picnicClient.auth.login("email", "password");

// If 2FA is required:
await picnicClient.auth.generate2FACode("SMS");
await picnicClient.auth.verify2FA("123456");
```

### Usage examples

```ts
// Search for products and recipes
const results = await picnicClient.catalog.getSearchResults("Affligem blond");

// Add a product to the cart
await picnicClient.cart.addProductToCart(11295810, 2);

// Bulk add products to the cart
await picnicClient.cart.addProductsToCart([
  { productId: "s11295810", quantity: 2 },
  { productId: "s10000123", quantity: 1 },
]);
```

### Pages (Fusion and RSC)

Picnic serves a page either as a Fusion page (JSON) or as
[React Server Components](https://react.dev/reference/rsc/server-components), and is moving more pages to RSC.
`app.getPage(pageId)` returns the page in the format it came in; an RSC page comes as a tree of its components:

```ts
const page = await picnicClient.app.getPage("home_page_root");
if (page.format === "fusion") {
  console.log(page.page);
} else {
  console.log(page.content.nodes);
}
```

The domain methods (`catalog.getProduct`, `recipe.getRecipe`, ...) read the page they need themselves. When
Picnic serves such a page in a format the method doesn't read yet, it throws an `UnexpectedPageFormatError`.

### Custom requests

For endpoints not yet covered by a domain service, use `sendRequest` directly:

```ts
await picnicClient.sendRequest("GET", "/unknown/route");
await picnicClient.sendRequest("POST", "/invite/friend", { email: "friend@example.com" }, { includePicnicHeaders: true });
```

The fourth argument takes options: `includePicnicHeaders` (the `x-picnic-agent` and `x-picnic-did` headers many routes
need), `headers`, `authenticated`, `binary` (return an `ArrayBuffer`) and `contentType` (for a raw body). Responses
served as an RSC payload (`text/x-component`) are returned as raw text instead of parsed JSON.

## API reference

The client exposes the following domain services, each grouping a set of related endpoints:

| Service | Accessor | Description |
| --- | --- | --- |
| **App** | `client.app` | Bootstrap data, pages in either format, in-app messages, and deeplink resolution. |
| **Auth** | `client.auth` | Login, logout, 2FA, and phone verification. |
| **Cart** | `client.cart` | The cart, adding and removing products, delivery slots, and the cart footer. |
| **Catalog** | `client.catalog` | Product search, suggestions, categories, product details, and images. |
| **Checkout** | `client.checkout` | Starting the checkout, paying, and confirming the order. |
| **Consent** | `client.consent` | Consent settings and GDPR declarations. |
| **Content** | `client.content` | Static content pages (FAQ, search empty state). |
| **Customer Service** | `client.customerService` | Contact info and opening times. |
| **Delivery** | `client.delivery` | Delivery history, tracking, ratings, invoices, parcels, and reminders. |
| **Payment** | `client.payment` | Payment profile and wallet transactions. |
| **Recipe** | `client.recipe` | Recipe browsing and saving, plus creating and editing your own (user defined) recipes: name, portions, ingredients, note and image. |
| **User** | `client.user` | User details, profile, suggestions, and push tokens. |
| **User Onboarding** | `client.userOnboarding` | Household/business details and push subscriptions. |

Each service method is fully typed. Methods return the data the way the app shows it, as camelCase models such as
`Cart`, `Delivery`, `Product` and `Recipe`; the cart mutations return the updated `Cart`. Types prefixed with `Raw`
mirror Picnic's own JSON (snake_case) and are what the models are read from. The types are available as
`PicnicClient.Types.<domain>`, e.g. `PicnicClient.Types.cart.Cart`.

Catalog and user-defined recipes share `RecipeSummary`, `Recipe`, and
`RecipeIngredient` types:

```ts
const saved = await picnicClient.recipe.getSavedRecipes();
const own = await picnicClient.recipe.getUserDefinedRecipes();
if (saved.length) {
  const recipe = await picnicClient.recipe.getRecipe(saved[0].id, 2);
  // recipe.name, recipe.imageId, recipe.ingredients; quantities are for 2 portions.
}
```

`getRecipe` reads catalog recipes and user defined recipes alike. Omit portions to use the stored default.
Pass `{ resolveIngredientNames: true }` as the third argument to look up names missing from recipe tiles.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines.

If you enjoy this package, consider using the discount code [MAAR3267](https://picnic.app/nl/vriendenkorting/MAAR3267) so we both get a discount on our next order. 😄
