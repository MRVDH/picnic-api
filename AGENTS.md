# Agent Instructions

## Project Structure

The codebase follows a domain-based architecture:

```
src/
  index.ts              # PicnicClient class — extends HttpClient with all domain services
  http-client.ts        # Base HTTP client — handles request construction, auth headers, errors
  types/
    common.ts           # Shared types (ApiConfig, CountryCode, etc.)
    public.ts           # The public types, exposed as PicnicClient.Types
  pages/                # Reading Picnic's pages, in either format
    page-client.ts      # PageClient: fetches pages (Fusion or RSC) and runs RSC server actions
    types.ts            # Public page types: Page, PageFormat, RscPageContent, RscNode
    fusion.ts           # Types for Fusion/PML page responses
    pml.ts              # Shared readers for Fusion/PML trees (find nodes, texts, prices, badges, tables)
    rsc.ts              # Parses RSC payloads into rows and into the component tree
    rsc-payload.ts      # Types of a raw RSC payload (internal)
  errors/               # Error classes exposed on PicnicClient
  domains/
    app/                # Bootstrap data, pages, in-app messages, deeplinks
    auth/               # Login/authentication
    cart/               # The cart, delivery slots, the cart footer
    catalog/            # Search, suggestions, categories, products, images
    checkout/           # Starting the checkout, payment, confirming the order
    consent/            # User consent management
    content/            # Content pages
    customer-service/   # Contact info and opening times
    delivery/           # Deliveries, tracking, parcels
    payment/            # Payment methods, billing
    recipe/             # Recipes, cookbook
    user/               # User details, profile, settings
```

Each domain folder contains:
- `service.ts` — Service class with methods that call API endpoints via `this.http.sendRequest(...)`. Should only contain route definitions and minimal glue logic.
- `types.ts` — TypeScript interfaces/types for the domain's request and response data.
- One file per model *(optional)*, named after the model it produces (`cart/cart.ts`, `delivery/delivery.ts`, `catalog/product.ts`) — pure extraction functions that turn raw responses and pages into the domain's models, with tests next to them (`cart/cart.test.ts`). The service's own tests are `service.test.ts`; tests against the live API are `<domain>.live.test.ts`. Read pages by their structure (component ids, layout, `textType`, state boundaries) with `src/pages/pml.ts`, not by matching the text in them: texts differ per country and a text pattern also matches other products on the page.

## Initial Setup

For proper API testing and development a few things need to be set up first:

- **picnic-app folder**: Located in the picnic-api root and contains the decompiled Android app. If you don't see this folder, ask the user to create it. You can suggest to them the VS Code extension "APKLab" or suggest using jadx with parameters `--show-bad-code` and `--deobf`. If they don't have the Picnic APK file yet, they can download it from sources such as APK Pure.
- **playground.ts**: Located in the picnic-api root, used for directly calling and testing functions from `src/`. The playground file should contain example calls for most domain services. If you don't see this file, generate it with some example calls to different domain services.
- **.env file**: The playground and test cases uses `dotenv` to load environment variables. A `.env` file should exist in the picnic-api root with at least `PICNIC_AUTH_KEY=<your-auth-key>`. You can obtain an auth key by calling the `client.auth.login()` method first, which returns the key in the response headers.

### Build & Run

```bash
npm install                    # Install dependencies
npx ts-node playground.ts      # Run the playground file
```

## General Instructions

- Naming: a method returns either a model of what the app shows, in camelCase, under a plain name (`cart.getCart(): Cart`, `delivery.getDelivery(): Delivery`, `catalog.getProduct(): Product`), or Picnic's JSON as Picnic sends it, under a `Raw` prefix (`payment.getPaymentProfile(): RawPaymentProfile`). Every type that describes Picnic's JSON without a parsing step gets the prefix, also when a model reads it (`RawCart`). Type parts of Picnic's JSON you haven't seen as `unknown`, never `any`. Mutations without a useful result return `void`. Methods with more than one optional argument, or several arguments of the same type in a row, take an options object. Use the app's words for the user's world (recipe, cart, ingredient), not Picnic's internal ones (selling group, basket, sellable component), except in route paths and request bodies.
- The current Picnic app is the reference. Implement a feature the way the app does it (same routes, request bodies and page formats), and follow the app when it changes. Don't keep old behaviour alive with a workaround such as pinning an older agent for one request.
- When you're testing the API, use the `playground.ts` file in the root of the API repository to call the functions. Run it with `npx ts-node playground.ts`.
- If you get a request to update a certain route, check the decompiled app for the latest implementation of that route. The decompiled app is located in the picnic-app folder. Besides that, also call the function using the playground to compare the actual API response with your findings.
- Do not call mutation routes (like updates, add, delete, create, etc.) without explicit permission.
- Test files do not need to run unless explicitly mentioned. Use the playground.ts file for testing instead. You can ignore the test files for now, but they will be used in the future to ensure the API wrapper is working correctly.
- Tests that call the live API go in `*.live.test.ts` files. The publish workflow runs with `CI` set, which skips them, because it has no auth key. Tests that mock `fetch` use the regular `*.test.ts` name.
- Check if the comments above the function should be updated or not. If the comments are outdated, update them based on the latest implementation.
- Create a new domain folder (with `service.ts` and `types.ts`) if necessary, and register the new service in `src/index.ts`.
- If requests fail and you are unable to solve it, clearly indicate this in your report and provide the error message(s).
- Keep README.md short: it explains how to use the library, not its current state. Don't add lists that change with Picnic's app or pages (known RSC pages, the default agent version); those belong in the code comments.
- Feel free to update this AGENTS.md file if you think some instructions or guidelines are missing or can be improved and if the paths/code referenced here has changed.

### `sendRequest` Signature

The `HttpClient.sendRequest` method has the following parameters:

```typescript
sendRequest<TRequestData, TResponseData>(
  method: "GET" | "POST" | "PUT" | "DELETE",    // HTTP method
  path: string,                                 // API path, e.g. `/cart`, or an absolute URL
  data: TRequestData | null = null,             // Request body (for POST/PUT)
  options: RequestOptions = {},                 // See below
): Promise<TResponseData>

type RequestOptions = {
  includePicnicHeaders?: boolean;               // Adds the x-picnic-agent and x-picnic-did headers
  headers?: Record<string, string>;             // Extra headers
  authenticated?: boolean;                      // Default: only to the API's own origin; true: also to other hosts; false: never
  binary?: boolean;                             // Return the body as an ArrayBuffer
  contentType?: string;                         // MIME type of a raw (non-JSON) body, e.g. image/jpeg
};
```

Most routes the app calls need the Picnic headers: pass `{ includePicnicHeaders: true }`. `sendRequestWithHeaders` takes the same arguments and also returns the response headers, for routes where the app reads one (the auth key after a login, `X-Page-Version` for RSC pages).

Objects passed as `data` are sent as JSON. To send raw bytes (for example the recipe image upload), pass a `Blob`, `ArrayBuffer` or `Uint8Array` as `data` and the MIME type as `contentType`. Always go through `sendRequest` or `sendRequestWithHeaders`; do not call `fetch` directly from a service. Pages go through the `PageClient` (see Route Types).

## Searching the Decompiled App

When looking for API routes in the decompiled picnic-app:

- Look for Retrofit interface definitions — these declare API endpoints using annotations like `@GET`, `@POST`, `@PUT`, `@DELETE`.
- Search for URL path fragments (e.g., `cart`, `deliveries`, `user`) to find relevant endpoint declarations.
- Check model/DTO classes near the endpoint definitions for request/response types.
- Route paths in the decompiled code may be relative (e.g., `cart/add_product`) — the base URL is constructed by `HttpClient`.

## Route Types

- Some routes return regular JSON data objects, while others return JSON Fusion/PML objects.
- Some pages are served as a React Server Components (RSC) payload (`text/x-component`) instead of a Fusion page, depending on the page and the `x-picnic-agent` version. Newer app versions get RSC for pages that Picnic moved to its newer page platform (known: `category-tree-root`, `subcategory-page`, `category-product-overview`, `promotion-category-page`, `profile-root`, `promo-group-deep-dive`, `search-page-results`, `search-page-index`, `meals-category-page`, `meals-category-group-page`, `unavailability-replacements-page-root`). Picnic is moving more pages to RSC. Services never request `/pages/...` themselves: they read pages through the `PageClient` (`src/pages/page-client.ts`), which makes one request and returns what Picnic served. `getFusionPage` and `getRscContent` throw an `UnexpectedPageFormatError` naming the page when it comes in the other format, so a page that switches format fails clearly instead of reaching the wrong parser. When a page a domain method reads moves to RSC, add an RSC reader that returns the same model, and use `load` to pick the reader by format while Picnic serves both. `app.getPage` returns a page in either format (`Page`, types in `src/pages/types.ts`); the raw RSC payload (rows, module references, page version) stays internal. Parse RSC pages into domain models in picnic-api (e.g. `user.getProfile`, `catalog.getSearchResults`), not in the consumers. Data that client components load after the page is shown comes from server actions: find the action id with `PageClient.findServerActionId` and run it with `PageClient.runServerAction` (see `catalog.getSearchResults`). When bumping the default agent in `src/http-client.ts`, check which pages switch format.
- If a route uses JSON Fusion/PML objects, then you don't have to recreate types for those. Those types are defined in `src/pages/fusion.ts`. They might need updating though.
- There are API routes that are not statically defined in the picnic-app codebase. The PML/Fusion pages contain embedded JavaScript expressions that run client-side. An example of this is the recipe save button's `onPress` handler, which constructs an `ENDPOINT` action with a `url` field. This was found by fetching the `cookbook-page-content` page and extracting the PML expression from the `onRecipeLikeButtonPress` handler, which was the following: `{ actionType: "ENDPOINT", method: "post", url: "pages/task/recipe-saving", body: { payload: { recipe_id, saved_at: "<ISO timestamp>" } } }`. So when you are asked to find all routes related to a feature — besides looking through the picnic-app code — you will have to navigate the bootstrap and pages endpoints to look for these actions.
