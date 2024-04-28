# Picnic-API

[![npm version](https://img.shields.io/npm/v/picnic-api.svg?style=flat-square)](https://www.npmjs.org/package/picnic-api) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-api/blob/master/LICENSE) [![Buy me an Affligem blond](https://img.shields.io/badge/buy%20me%20an-affligem%20blond-orange?style=flat-square)](https://www.buymeacoffee.com/MRVDH) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

Unofficial and unaffiliated Node.js npm package as a wrapper for the API of the online supermarket Picnic.

## Getting started

Using `npm`:

```bash
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
    apiVersion: "15", // default 15 as this is what the app currently uses. The api version for the requests. The effect of this version numbering is unknown to me.
    authKey: "long string here", // default null. The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
    url: "url here" // default https://storefront-prod.nl.picnicinternational.com/api/15. The url to send requests to.
});
```

If no authKey was given in the options use the `login` method. Empty response if successful, otherwise an error.

```js
await picnicClient.login("email", "password");
// and then send an authenticated request...
```

Example of a `GET` request:

```js
const searchResults = await picnicClient.search("Affligem blond");
```

Example of a `POST` request:

```js
await picnicClient.addProductToShoppingCart(11295810, 2);
```

Examples of a custom (unimplemented) request:

```js
picnicClient.sendRequest("GET", "/unknown/route");
picnicClient.sendRequest("POST", "/invite/friend", { email: "email@email.email" });
```

## Contributing

If you want to contribute to this project then please read the [CONTRIBUTING.md](./CONTRIBUTING.md) file, and if you like this library then please consider using my discount code [MAAR3267](https://picnic.app/nl/vriendenkorting/MAAR3267) so that we both get a 10 euro discount on our orders. 😄
