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

  constructor(options?: ApiConfig) {
    this.countryCode = options?.countryCode || "NL";
    this.apiVersion = options?.apiVersion || "15";
    this.authKey = options?.authKey || null;
    this.url = options?.url || `https://storefront-prod.${this.countryCode.toLowerCase()}.picnicinternational.com/api/${this.apiVersion}`;
  }

  get baseHeaders(): Record<string, string> {
    return {
      "User-Agent": "okhttp/3.12.2",
      "Content-Type": "application/json; charset=UTF-8",
      ...(this.authKey && { "x-picnic-auth": this.authKey }),
    };
  }

  get picnicHeaders(): Record<string, string> {
    return {
      "x-picnic-agent": "30100;1.15.232-15154",
      "x-picnic-did": "3C417201548B2E3B",
    };
  }

  /**
   * Can be used to send custom requests that are not covered by the domain services.
   * @param {string} method The HTTP method to use: GET, POST, PUT or DELETE.
   * @param {string} path The path, optionally including query params. Example: `/cart/set_delivery_slot` or `/my_store?depth=0`.
   * @param {TRequestData|null} [data=null] The request body, typically for POST or PUT requests.
   * @param {boolean} [includePicnicHeaders=false] Whether to include x-picnic-agent and x-picnic-did headers.
   * @param {boolean} [isImageRequest=false] When true, returns an ArrayBuffer instead of JSON.
   */
  async sendRequest<TRequestData, TResponseData>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    data: TRequestData | null = null,
    includePicnicHeaders: boolean = false,
    isImageRequest: boolean = false,
  ): Promise<TResponseData> {
    const headers = new Headers({
      ...this.baseHeaders,
      ...(includePicnicHeaders && this.picnicHeaders),
    });

    const response = await fetch(`${this.url}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    if (!response.ok) {
      const body = await response.text();

      try {
        const errorData: any = JSON.parse(body);
        throw new Error(`${errorData.error?.message || response.statusText}`);
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
        throw new Error(`${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`);
      }
    }

    if (isImageRequest) {
      return response.arrayBuffer() as Promise<TResponseData>;
    }

    if (response.body !== null) {
      return response.json() as Promise<TResponseData>;
    }

    return undefined as TResponseData;
  }
}
