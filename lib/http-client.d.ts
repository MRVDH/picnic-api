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
    deviceId: string;
    agent: string;
    constructor(options?: ApiConfig);
    get baseHeaders(): Record<string, string>;
    get picnicHeaders(): Record<string, string>;
    /**
     * Can be used to send custom requests that are not covered by the domain services.
     *
     * Objects passed as `data` are sent as JSON. A `Blob`, `ArrayBuffer` or typed array
     * (e.g. `Uint8Array`) is sent as-is, with `Content-Type` set to `contentType`.
     * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
     * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
     * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
     * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
     * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
     * @param {string} [contentType="application/octet-stream"] The MIME type of a raw (non-JSON) `data` body, e.g. `image/jpeg`.
     */
    sendRequest<TRequestData, TResponseData>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: TRequestData | null, includePicnicHeaders?: boolean, isImageRequest?: boolean, contentType?: string): Promise<TResponseData>;
}
//# sourceMappingURL=http-client.d.ts.map