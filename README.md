[![npm version](https://img.shields.io/npm/v/picnic-api.svg?style=flat-square)](https://www.npmjs.org/package/picnic-api) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-api/blob/master/LICENSE) [![Buy me an Affligem blond](https://img.shields.io/badge/buy%20me%20an-affligem%20blond-orange?style=flat-square)](https://www.buymeacoffee.com/MRVDH) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

# Picnic-API
Unofficial (unaffiliated) Node.js npm package for the API of the online supermarket Picnic.

## Getting started
Using `npm`:
```
npm install picnic-api
```

Then import the package into your project. `PicnicClient` is the default export.
```js
import PicnicClient from "picnic-api";

// or

const PicnicClient = require("picnic-api");
```

Now initialize the Picnic client with an optional options object.
```js
const picnicClient = new PicnicClient();

// or

const picnicClient = new PicnicClient({
    countryCode: "NL", // The country code for the requests. Can be NL or DE. Untested for other countries.
    apiVersion: "17", // default 17 as this is what the app currently uses. The api version for the requests. Does not seem to do anything yet.
    authKey: "long string here", // default null. The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
    url: "url here" // default https://storefront-prod.nl.picnicinternational.com/api/17. The url to send requests to.
});
```

If no authKey was given in the options use the `login` method. Empty response if successful, otherwise an error.
```js
await picnicClient.login("email", "password");
// send an authenticated request...

// or

picnicClient.login("email", "password").then(_ => {
    // send an authenticated request...
});
```

Example of a `GET` request:
```js
let searchResults = await picnicClient.search("Affligem blond");

// or

picnicClient.search("Affligem blond").then(searchResults => {
    
});
```

Example of a `POST` request:
```js
await picnicClient.addProductToShoppingCart(11295810, 2);

// or

picnicClient.addProductToShoppingCart(11295810, 2).then(shoppingCart => {
    
});
```
If you like this library then consider using my discount code [MAAR3267](https://picnic.app/nl/vriendenkorting/MAAR3267) so that we both get a 5 euro discount on our orders. 😄

## API Routes
Most API routes have been implemented as methods in the `PicnicClient` class. However, to get a list of all known API routes the method `getKnownApiRoutes` can be used. These routes are extracted from the Picnic android app. Latest extraction done for version `1.15.129`.

Examples of a custom (unimplemented) request:
```js
picnicClient.sendRequest(HttpMethods.GET, "/unknown/route");
picnicClient.sendRequest(HttpMethods.POST, "/invite/friend", { email: "email@email.email" });
```