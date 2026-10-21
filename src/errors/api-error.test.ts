import HttpClient from "../http-client";
import { CheckoutIssueError } from "./checkout-error";
import { PicnicApiError } from "./api-error";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function errorResponse(status: number, statusText: string, body: string) {
  return { ok: false, status, statusText, headers: new Headers(), text: () => Promise.resolve(body) };
}

let http: HttpClient;

beforeEach(() => {
  mockFetch.mockReset();
  http = new HttpClient({ authKey: "auth-key" });
});

describe("PicnicApiError", () => {
  it("carries the status and Picnic's code for a wrong password", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(401, "Unauthorized", '{"error":{"code":"AUTH_INVALID_CRED","message":"Invalid credentials","details":{}}}'));

    const error = await http.sendRequest("POST", "/user/login", {}).catch((e) => e);

    expect(error).toBeInstanceOf(PicnicApiError);
    expect(error).toMatchObject({ status: 401, code: "AUTH_INVALID_CRED", message: "Invalid credentials" });
  });

  it("carries the status and Picnic's code for a wrong 2FA code", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, "Bad Request", '{"error":{"code":"OTP_NOT_VALID","message":"Otp is not valid","details":{}}}'));

    const error = await http.sendRequest("POST", "/user/2fa/verify", { otp: "000000" }).catch((e) => e);

    expect(error).toMatchObject({ status: 400, code: "OTP_NOT_VALID", message: "Otp is not valid" });
  });

  it("puts the status and body in the message when the body isn't JSON", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(403, "Forbidden", "<html>blocked</html>"));

    const error = await http.sendRequest("GET", "/cart").catch((e) => e);

    expect(error).toMatchObject({ status: 403, code: null, message: "403 Forbidden - <html>blocked</html>", body: "<html>blocked</html>" });
  });

  it("falls back to the status line for a JSON body without a message", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(500, "Internal Server Error", "{}"));

    const error = await http.sendRequest("GET", "/cart").catch((e) => e);

    expect(error).toMatchObject({ status: 500, code: null, message: "500 Internal Server Error" });
  });

  it("throws a CheckoutIssueError for cart issues", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, "Bad Request", '{"code":"CART_HAS_ISSUES","details":{"type":"X","localized_title":"T","localized_message":"M","resolve_key":"k","blocking":true}}'));

    await expect(http.sendRequest("POST", "/cart/checkout/start", {})).rejects.toBeInstanceOf(CheckoutIssueError);
  });
});

describe("sendRequest options", () => {
  it("throws a TypeError for a boolean fourth argument", async () => {
    await expect(http.sendRequest("GET", "/cart", null, true as never)).rejects.toThrow(TypeError);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
