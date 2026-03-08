import { AuthService } from "./service";
import HttpClient from "../../http-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let http: HttpClient;
let auth: AuthService;

beforeEach(() => {
  mockFetch.mockReset();
  http = new HttpClient({ authKey: "initial-auth-key" });
  auth = new AuthService(http);
});

describe("AuthService - verify2FACode", () => {
  it("should capture the new auth key from response headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "x-picnic-auth": "new-2fa-auth-key" }),
      text: () => Promise.resolve(""),
    });

    const result = await auth.verify2FACode("123456");

    expect(result.authKey).toBe("new-2fa-auth-key");
    expect(http.authKey).toBe("new-2fa-auth-key");
  });

  it("should send the correct request with picnic headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "x-picnic-auth": "new-key" }),
      text: () => Promise.resolve(""),
    });

    await auth.verify2FACode("654321");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/user/2fa/verify"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ otp: "654321" }),
      }),
    );

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.get("x-picnic-auth")).toBe("initial-auth-key");
    expect(callHeaders.get("x-picnic-agent")).toBeTruthy();
    expect(callHeaders.get("x-picnic-did")).toBeTruthy();
  });

  it("should throw when no auth key is returned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      text: () => Promise.resolve(""),
    });

    await expect(auth.verify2FACode("123456")).rejects.toThrow("No auth key received");
  });

  it("should throw on non-ok response with error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify({ error: { message: "Invalid OTP" } })),
    });

    await expect(auth.verify2FACode("000000")).rejects.toThrow("Invalid OTP");
  });

  it("should throw on non-ok response without JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: new Headers(),
      text: () => Promise.resolve(""),
    });

    await expect(auth.verify2FACode("000000")).rejects.toThrow("500 Internal Server Error");
  });
});
