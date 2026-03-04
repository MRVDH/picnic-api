# Agent Instructions

## Project Structure

The codebase follows a domain-based architecture:

```
src/
  index.ts              # PicnicClient class — extends HttpClient with all domain services
  http-client.ts        # Base HTTP client — handles request construction, auth headers, errors
  types/
    common.ts           # Shared types (ApiConfig, CountryCode, etc.)
    fusion.ts           # Types for Fusion/PML page responses
  domains/
    app/                # Bootstrap data, pages, announcements
    auth/               # Login/authentication
    cart/               # Cart management, delivery slots, checkout
    catalog/            # Search, suggestions, product lists
    consent/            # User consent management
    content/            # Content pages
    customer-service/   # Support tickets, contact options
    delivery/           # Delivery status, scenarios
    payment/            # Payment methods, billing
    recipe/             # Recipes, cookbook
    user/               # User details, profile, settings
    user-onboarding/    # Onboarding flows
```

Each domain folder contains:
- `service.ts` — Service class with methods that call API endpoints via `this.http.sendRequest(...)`. Should only contain route definitions and minimal glue logic.
- `types.ts` — TypeScript interfaces/types for the domain's request and response data.
- `helpers.ts` *(optional)* — Pure helper/extraction functions used by the service (e.g. parsing Fusion page responses into typed models). Created when a service needs non-trivial data transformation logic that would clutter the service file.

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

- When you're testing the API, use the `playground.ts` file in the root of the API repository to call the functions. Run it with `npx ts-node playground.ts`.
- If you get a request to update a certain route, check the decompiled app for the latest implementation of that route. The decompiled app is located in the picnic-app folder. Besides that, also call the function using the playground to compare the actual API response with your findings.
- Do not call mutation routes (like updates, add, delete, create, etc.) without explicit permission.
- Test files do not need to run unless explicitly mentioned. Use the playground.ts file for testing instead. You can ignore the test files for now, but they will be used in the future to ensure the API wrapper is working correctly.
- Check if the comments above the function should be updated or not. If the comments are outdated, update them based on the latest implementation.
- Create a new domain folder (with `service.ts` and `types.ts`) if necessary, and register the new service in `src/index.ts`.
- If requests fail and you are unable to solve it, clearly indicate this in your report and provide the error message(s).
- Feel free to update this AGENTS.md file if you think some instructions or guidelines are missing or can be improved and if the paths/code referenced here has changed.

### `sendRequest` Signature

The `HttpClient.sendRequest` method has the following parameters:

```typescript
sendRequest<TRequestData, TResponseData>(
  method: "GET" | "POST" | "PUT" | "DELETE",    // HTTP method
  path: string,                                 // API path, e.g. `/cart`
  data: TRequestData | null = null,             // Request body (for POST/PUT)
  includePicnicHeaders: boolean = false,        // When true, adds x-picnic-agent and x-picnic-did headers
  isImageRequest: boolean = false,              // When true, returns ArrayBuffer instead of JSON
): Promise<TResponseData>
```

Some routes require Picnic headers to be sent. You can enable these by setting `includePicnicHeaders` to `true` (the fourth parameter).

## Searching the Decompiled App

When looking for API routes in the decompiled picnic-app:

- Look for Retrofit interface definitions — these declare API endpoints using annotations like `@GET`, `@POST`, `@PUT`, `@DELETE`.
- Search for URL path fragments (e.g., `cart`, `deliveries`, `user`) to find relevant endpoint declarations.
- Check model/DTO classes near the endpoint definitions for request/response types.
- Route paths in the decompiled code may be relative (e.g., `cart/add_product`) — the base URL is constructed by `HttpClient`.

## Route Types

- Some routes return regular JSON data objects, while others return JSON Fusion/PML objects.
- If a route uses JSON Fusion/PML objects, then you don't have to recreate types for those. Those types are defined in `src/types/fusion.ts`. They might need updating though.
- There are API routes that are not statically defined in the picnic-app codebase. The PML/Fusion pages contain embedded JavaScript expressions that run client-side. An example of this is the recipe save button's `onPress` handler, which constructs an `ENDPOINT` action with a `url` field. This was found by fetching the `cookbook-page-content` page and extracting the PML expression from the `onRecipeLikeButtonPress` handler, which was the following: `{ actionType: "ENDPOINT", method: "post", url: "pages/task/recipe-saving", body: { payload: { recipe_id, saved_at: "<ISO timestamp>" } } }`. So when you are asked to find all routes related to a feature — besides looking through the picnic-app code — you will have to navigate the bootstrap and pages endpoints to look for these actions.
