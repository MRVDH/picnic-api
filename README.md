[![npm version](https://img.shields.io/npm/v/picnic-api.svg?style=flat-square)](https://www.npmjs.org/package/picnic-api) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/MRVDH/picnic-api/blob/master/LICENSE) [![Buy me an Affligem blond](https://img.shields.io/badge/buy%20me%20an-affligem%20blond-orange?style=flat-square)](https://www.buymeacoffee.com/MRVDH) [![MAAR3267](https://img.shields.io/badge/picnic%20discount-MAAR3267-E1171E?style=flat-square)](https://picnic.app/nl/vriendenkorting/MAAR3267)

# Picnic-API
Unofficial (unaffiliated) Node.js npm package for the API of the online supermarket Picnic.

## Getting started
Using `npm`:
```
npm install picnic-api
```

Then import the package into your project. `PicnicClient` is the default export. `CountryCodes` can be included when you want to make requests for the German version of Picnic for example. `ImageSizes` can be used for retreiving images. `HttpMethods` can be used when you want to make custom requests. More on that below.
```js
import PicnicClient, { CountryCodes, ImageSizes, HttpMethods } from "picnic-api";

// or

const PicnicClient = require("picnic-api");
const { CountryCodes, ImageSizes, HttpMethods } = PicnicClient;
```

Now initialize the Picnic client with an optional options object.
```js
const picnicClient = new PicnicClient();

// or

const picnicClient = new PicnicClient({
    countryCode: CountryCodes.NL, // The country code for the requests.
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
Most API routes have been implemented as methods in the `PicnicClient` class. However, to get a list of all known API routes the method `getKnownApiRoutes` can be used. These routes are extracted from the Picnic android app. Latest extraction done for version `1.15.77`.

Examples of a custom (unimplemented) request:
```js
picnicClient.sendRequest(HttpMethods.GET, "/unknown/route");
picnicClient.sendRequest(HttpMethods.POST, "/invite/friend", { email: "email@email.email" });
```

### Implemented routes
List of implemented routes and their parameters.

```js
/**
 * Logs the user into picnic to be able to send requests.
 * @param {String} username The username of the Picnic account.
 * @param {String} password The password of the Picnic account.
 * @returns {Promise} Empty response if successful, otherwise an error.
 */
login (username, password)

/**
 * Gets the details of the current logged in user.
 */
getUserDetails ()

/**
 * Searches in picnic products.
 * @param {String} query The keywords to search for. 
 */
search (query)

/**
 * returns a suggestion on Picnic products matching the query.
 * @param {String} query The keywords for suggestions. 
 */
getSuggestions (query)

/**
 * Returns the detials of a specific product.
 * @param {String} productId The id of the product to get. 
 */
getProduct (productId)

/**
 * Retreives product images from the server as an arrayBuffer.
 * @param {String} imageId The image id to retreive.
 * @param {String} size The size of the image to return.
 */
getImage (imageId, size)

/**
 * Retreives product images from the server ad a DataUri.
 * @param {String} imageId The image id to retreive.
 * @param {String} size The size of the image to return.
 */
getImageAsDataUri (imageId, size)

/**
 * Returns the catgories.
 * @param {Number} [depth=0] The cagetory depth of items to retrieve.
 */
getCategories (depth = 0)

/**
 * Returns the shopping cart information of the user and contents.
 */
getShoppingCart ()

/**
 * Adds a product to the shopping cart.
 * @param {String} productId The id of the product to add.
 * @param {Number} [count=1] The amount of this product to add. 
 */
addProductToShoppingCart (productId, count = 1)

/**
 * Removes a product from the shopping cart.
 * @param {String} productId The id of the product to remove.
 * @param {Number} [count=1] The amount of this product to remove. 
 */
removeProductFromShoppingCart (productId, count = 1)

/**
 * Clears the shopping cart of the user.
 */
clearShoppingCart ()

/**
 * Get all the delivery slots.
 */
getDeliverySlots ()

/**
 * Selects a delivery slot.
 * @param {String} slotId The id of the delivery slot to be selected.
 */
setDeliverySlot (slotId)

/**
 * Returns all past and current deliveries of the user. 
 * @param {Boolean} [summary=false] Return a summary (less data).
 * @param {Array} [filter=[]] An array with the statusses of the deliveries. For example; ['COMPLETED'] will only get completed deliveries. Possible options include CURRENT, COMPLETED and CANCELLED.
 */
getDeliveries (summary = false, filter = [])

/**
 * Get the details of one specific delivery.
 * @param {String} deliveryId The id of the delivery to look up.
 */
getDelivery (deliveryId)

/**
 * Get the position of one specific delivery. Only works on deliveries on the way.
 * @param {String} deliveryId The id of the delivery to look up.
 */
getDeliveryPosition (deliveryId)

/**
 * Get the driver and route information of the delivery.
 * @param {String} deliveryId The id of the delivery to look up.
 */
getDeliveryScenario (deliveryId)

/**
 * Cancels the order with the given delivery id.
 * @param {String} deliveryId 
 */
cancelDelivery (deliveryId)

/**
 * Sets a rating for the delivery from 0 to 10. Will return 400 if a delivery already has a rating. 
 * @param {String} deliveryId 
 * @param {Number} rating 
 */
setDeliveryRating (deliveryId, rating)

/**
 * (Re)sends the invoice email of the delivery.
 * @param {String} deliveryId 
 */
sendDeliveryInvoiceEmail (deliveryId)

/**
 * Returns the status of the order (not delivery) with the given id.
 * @param {String} orderId 
 */
getOrderStatus (orderId)

/**
 * Returns all the lists and sublists.
 * @param {Number} [depth=0] The cagetory depth of items to retrieve.
 */
getLists (depth = 0)

/**
 * Returns the list and its sublists, or a specific sublist if the id is given.
 * @param {String} listId The id of the list to get.
 * @param {String} [subListId] The id of the sub list to get.
 * @param {Number} [depth=0] The cagetory depth of items to retrieve.
 */
getList (listId, subListId, depth = 0)

/**
 * Returns the MGM details. This are the friends discount data. 
 */
getMgmDetails ()

/**
 * Returns the list of consent settings.
 * @param {Boolean} [general] Returns only the 'general' consent settings.
 */
getConsentSettings (general = false)

/**
 * Sets one or multiple consent options to true or false.
 * @param {{consent_request_text_id: String, consent_request_locale: String, agreement: Boolean}[]} consentDeclarations An array of objects of consent items. Example: [ { consent_request_text_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', consent_request_locale: 'nl_NL', agreement: false } ]
 */
setConsentSettings (consentDeclarations)

/**
 * Returns the popup messages in the app. For example, the message after a delivery, asking if the delivery was satisfactory.
 */
getMessages ()

/**
 * Returns the reminders.
 */
getReminders ()

/**
 * Can be used to send custom requests that are not implemented but do need authentication for it.
 * @param {String} method The HTTP method to use, such as GET, POST, PUT and DELETE.
 * @param {String} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
 * @param {Object|Array} [data=null] The request body, usually in case of a POST or PUT request.
 * @param {Boolean} [includePicnicHeaders=false] If it should include x-picnic-agent and x-picnic-did headers.
 * @param {Boolean} [isImageRequest=false] Will add the arrayBuffer response type if true.
 */
sendRequest (method, path, data = null, includePicnicHeaders = false, isImageRequest = false)

/**
 * Returns list (string) of all known API routes.
 */
getKnownApiRoutes ()

/**
 * Country codes for the Picnic requests.
 */
const CountryCodes = {
    NL: "NL",
    DE: "DE"
}


/**
 * HTTP Methods to be used for custom requests.
 */
const HttpMethods = {
    GET: "get",
    HEAD: "head",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
    CONNECT: "connect",
    OPTIONS: "options",
    TRACE: "trace",
    PATCH: "patch"
}

/**
 * Image sizes for retreiving product images.
 */
const ImageSizes = {
    TINY: "tiny",
    SMALL: "small",
    MEDIUM: "medium",
    LARGE: "large",
    EXTRA_LARGE: "extra-large"
}
```