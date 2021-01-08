# Picnic-API
Unofficial (unaffiliated) Node.js npm package for the API of the online supermarket Picnic.

## Getting started
Using `npm`:
```
npm install picnic-api
```

Then import the package into your project. `PicnicClient` is the default export. `CountryCodes` can be included when you want to make requests for the German version of Picnic for example. `HttpMethods` can be used when you want to make custom requests. More on that below.
```js
import PicnicClient, { CountryCodes, HttpMethods } from "picnic-api";
```

Now initialize the Picnic client with an optional options object.
```js
const picnicClient = new PicnicClient();

// or

const picnicClient = new PicnicClient({
    countryCode: CountryCodes.NL // The country code for the requests.
    apiVersion: "1000" // default 1000. The api version for the requests. Does not seem to do anything yet.
    authKey: "long string here" // default null. The code for the x-picnic-auth header to make authenticated requests. If not supplied then login() needs to be called before making any other requests.
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

Exmaple of a `POST` request:
```js
await picnicClient.addProductToShoppingCart(11295810, 2);

// or

picnicClient.addProductToShoppingCart(11295810, 2).then(shoppingCart => {
    
});
```

## API Routes
Most API routes have been implemented as methods in the `PicnicClient` class. However, to get a list of all known API routes the method `getKnownApiRoutes` can be used. These routes are extracted from the Picnic android app. Latest extraction done for version `1.15.71`.

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
 * Returns the catgories.
 * @param {Number} depth The depth of cagetories to retrieve.
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
 */
getLists ()

/**
 * Returns the list and its sublists, or a specific sublist if the id is given.
 * @param {String} listId The id of the list to get.
 * @param {String} [subListId] The id of the sub list to get.
 */
getList (listId, subListId)

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
 * Can be used to send custom requests that are not implemented but do need authentication for it.
 * @param {String} method The HTTP method to use, such as GET, POST, PUT and DELETE.
 * @param {String} path The path, possibly including query params. Example: '/cart/set_delivery_slot' or '/my_store?depth=0'.
 * @param {Object|Array} data The request body, usually in case of a POST or PUT request.
 */
sendRequest (method, path, data = null)

/**
 * Returns list (string) of all known API routes.
 */
getKnownApiRoutes ()

/**
 * Country codes
 */
const CountryCodes = {
    NL: "NL",
    DE: "DE"
}

/**
 * HTTP methods
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
```