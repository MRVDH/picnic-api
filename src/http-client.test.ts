import HttpClient from "./http-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

let http: HttpClient;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ ok: true, status: 200, headers: new Headers({ "content-type": "application/json" }), body: {}, text: () => Promise.resolve(JSON.stringify({})), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) });
  http = new HttpClient({ countryCode: "NL", authKey: "auth-key" });
});

/** The auth key header the last request was sent with, or null. */
const sentAuthKey = () => mockFetch.mock.calls[0][1].headers.get("x-picnic-auth");

describe("HttpClient auth key", () => {
  it("is sent with a path on the API", async () => {
    await http.sendRequest("GET", "/cart");

    expect(sentAuthKey()).toBe("auth-key");
  });

  it("is sent with an absolute URL on the API's own origin", async () => {
    await http.sendRequest("GET", "https://storefront-prod.nl.picnicinternational.com/static/images/abc/small.png", null, { binary: true });

    expect(sentAuthKey()).toBe("auth-key");
  });

  it("is not sent to another host", async () => {
    await http.sendRequest("GET", "https://bank.example.com/pay?id=1");

    expect(sentAuthKey()).toBeNull();
  });

  it("is sent to another host when the caller opts in", async () => {
    await http.sendRequest("GET", "https://cdn.example.com/file", null, { authenticated: true });

    expect(sentAuthKey()).toBe("auth-key");
  });

  it("is not sent to the API when authenticated is false", async () => {
    await http.sendRequest("POST", "/user/login", {}, { authenticated: false });

    expect(sentAuthKey()).toBeNull();
  });

  it("compares against a custom API url", async () => {
    http = new HttpClient({ authKey: "auth-key", url: "https://proxy.example.com/api/15" });

    await http.sendRequest("GET", "https://proxy.example.com/static/x.png");

    expect(sentAuthKey()).toBe("auth-key");
  });
});

describe("HttpClient response body", () => {
  it("returns undefined for an empty body", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve("") });

    expect(await http.sendRequest("POST", "/cart/clear")).toBeUndefined();
  });
});

describe("HttpClient timeout", () => {
  it("aborts a request that takes longer than the configured timeout", async () => {
    http = new HttpClient({ timeout: 10 });
    mockFetch.mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason))));

    await expect(http.sendRequest("GET", "/cart")).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
