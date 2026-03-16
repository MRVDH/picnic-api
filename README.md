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
  countryCode: "NL", // The country code for the API. Options: "NL" (default) or "DE".
  apiVersion: "15",  // The API version (default "15").
  authKey: "...",    // An existing auth key to skip the login step.
  url: "...",        // A custom base URL (defaults to https://storefront-prod.<cc>.picnicinternational.com/api/<version>).
});
```

### Authentication

Most endpoints require authentication. Call `auth.login()` to obtain an auth key, which is automatically stored in the client and sent with subsequent requests. If you already have a key from a previous session, pass it as `authKey` in the constructor instead.

```ts
await picnicClient.auth.login("email", "password");
```

### Usage examples

```ts
// Search for products
const results = await picnicClient.catalog.search("Affligem blond");

// Add a product to the cart
await picnicClient.cart.addProductToCart(11295810, 2);

// Get available delivery slots
const slots = await picnicClient.cart.getDeliverySlots();

// Get details of a specific delivery
const delivery = await picnicClient.delivery.getDelivery("delivery-id");
```

### Custom requests

For endpoints not yet covered by a domain service, use `sendRequest` directly:

```ts
await picnicClient.sendRequest("GET", "/unknown/route");
await picnicClient.sendRequest("POST", "/invite/friend", { email: "friend@example.com" });
```

## API reference

The client exposes the following domain services, each grouping a set of related endpoints:

| Service | Accessor | Description |
| --- | --- | --- |
| **App** | `client.app` | Bootstrap data, pages, and deeplink resolution. |
| **Auth** | `client.auth` | Login, logout, 2FA, and phone verification. |
| **Cart** | `client.cart` | Cart management, delivery slots and selling units (recipes, meal plans, selling groups). |
| **Catalog** | `client.catalog` | Product search, suggestions, details, and images. |
| **Consent** | `client.consent` | Consent settings and GDPR declarations. |
| **Content** | `client.content` | Static content pages (FAQ, search empty state). |
| **Customer Service** | `client.customerService` | Contact info, messages, reminders, and parcels. |
| **Delivery** | `client.delivery` | Delivery history, live position, ratings, and invoices. |
| **Payment** | `client.payment` | Payment profile and wallet transactions. |
| **Recipe** | `client.recipe` | Recipe browsing and saving. |
| **User** | `client.user` | User details, profile, suggestions, and push tokens. |
| **User Onboarding** | `client.userOnboarding` | Household/business details and push subscriptions. |

Each service method is fully typed — explore the type definitions under `src/domains/<service>/types.ts` for request and response shapes.

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines.

If you enjoy this package, consider using the discount code [MAAR3267](https://picnic.app/nl/vriendenkorting/MAAR3267) so we both get a discount on our next order. 😄
