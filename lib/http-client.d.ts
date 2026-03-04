import { ApiConfig, CountryCode } from "./types/common";
/**
 * Base HTTP client that handles request construction, authentication headers,
 * and error handling for the Picnic API.
 */
export default class HttpClient {
    countryCode: CountryCode;
    apiVersion: string;
    authKey: string | null;
    url: string;
    constructor(options?: ApiConfig);
    /**
     * Can be used to send custom requests that are not covered by the domain services.
     * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
     * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
     * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
     * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
     * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
     */
    sendRequest<TRequestData, TResponseData>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: TRequestData | null, includePicnicHeaders?: boolean, isImageRequest?: boolean): Promise<TResponseData>;
}
//# sourceMappingURL=http-client.d.ts.map