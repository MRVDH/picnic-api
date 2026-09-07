import { ApiConfig, CountryCode } from "./types/common";
/** A request body accepted by `fetch`, without `null`. */
export type RequestBody = NonNullable<RequestInit["body"]>;
/**
 * Base HTTP client that handles request construction, authentication headers,
 * and error handling for the Picnic API.
 */
export default class HttpClient {
    countryCode: CountryCode;
    apiVersion: string;
    authKey: string | null;
    url: string;
    deviceId: string;
    agent: string;
    constructor(options?: ApiConfig);
    get baseHeaders(): Record<string, string>;
    get picnicHeaders(): Record<string, string>;
    /**
     * Can be used to send custom requests that are not covered by the domain services.
     * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
     * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
     * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
     * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
     * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
     */
    sendRequest<TRequestData, TResponseData>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: TRequestData | null, includePicnicHeaders?: boolean, isImageRequest?: boolean): Promise<TResponseData>;
    /**
     * Sends a request with a raw (non-JSON) body, such as image bytes.
     * Uses the same authentication headers and error handling as {@link sendRequest},
     * but sets `Content-Type` to `contentType` instead of the JSON default.
     * @param {string} method The HTTP method to use: POST or PUT.
     * @param {string} path The path, optionally including query params.
     * @param {RequestBody} body The raw request body.
     * @param {string} contentType The MIME type of the body, e.g. `image/jpeg`.
     * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
     */
    sendRawRequest<TResponseData>(method: "POST" | "PUT", path: string, body: RequestBody, contentType: string, includePicnicHeaders?: boolean): Promise<TResponseData>;
    /**
     * Low-level request used by {@link sendRequest} and {@link sendRawRequest}: resolves
     * the URL, sends the request and turns error responses into exceptions. Prefer those
     * two methods; this one exists so both share the same handling.
     */
    performRequest<TResponseData>(method: string, path: string, headers: Headers, body: RequestBody | null, isImageRequest: boolean): Promise<TResponseData>;
}
//# sourceMappingURL=http-client.d.ts.map