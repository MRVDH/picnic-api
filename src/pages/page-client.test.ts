import HttpClient from "../http-client";
import { UnexpectedPageFormatError } from "../errors/page-format-error";
import { PageClient } from "./page-client";
import { parseRscPayload } from "./rsc";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const CDN = "https://pages.example.com/store";

/** A fetch response: JSON for objects, RSC text for strings, bytes for Uint8Array. */
function response(body: unknown, headers: Record<string, string> = {}) {
  const contentType = typeof body === "string" ? "text/x-component" : body instanceof Uint8Array ? "application/octet-stream" : "application/json";
  return {
    ok: true,
    body: {},
    headers: new Headers({ "content-type": contentType, ...headers }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(body as string),
    arrayBuffer: () => Promise.resolve((body as Uint8Array).buffer),
  };
}

/** Answers bootstrap with the CDN and chunk requests with the given sources. */
function serve(chunks: Record<string, string>) {
  mockFetch.mockImplementation((url: string) => {
    if (url.endsWith("/bootstrap")) return Promise.resolve(response({ in_app_feature_config: { client_component_cdn_base_url: `${CDN}/` } }));
    const chunk = Object.keys(chunks).find((id) => url === `${CDN}/${id}.script.bundle`);
    if (chunk) return Promise.resolve(response(new TextEncoder().encode(chunks[chunk])));
    return Promise.reject(new Error(`Unexpected request: ${url}`));
  });
}

const page = parseRscPayload('1:I["./pages/search/results/index.tsx",["client-components.container.1","results_a.1","results_b.1","results_a.1"],"Results"]');

let pages: PageClient;

beforeEach(() => {
  mockFetch.mockReset();
  pages = new PageClient(new HttpClient({ authKey: "auth-key" }));
});

describe("PageClient", () => {
  it("load returns a Fusion page as it came", async () => {
    mockFetch.mockResolvedValue(response({ layout: { id: "home" } }));

    expect(await pages.load("home_page_root")).toEqual({ format: "fusion", pageId: "home_page_root", page: { layout: { id: "home" } } });
    expect(mockFetch.mock.calls[0][0]).toContain("/pages/home_page_root");
    expect(mockFetch.mock.calls[0][1].headers.get("x-picnic-agent")).toBeTruthy();
  });

  it("load parses an RSC payload and keeps the X-Page-Version header", async () => {
    mockFetch.mockResolvedValue(response('0:{"name":"page"}', { "x-page-version": "abc123" }));

    const result = await pages.load("category-tree-root");

    expect(result.format).toBe("rsc");
    if (result.format !== "rsc") return;
    expect(result.payload.rows["0"]).toEqual({ name: "page" });
    expect(result.payload.version).toBe("abc123");
  });

  it("getPage returns either format with one request", async () => {
    mockFetch.mockResolvedValue(response('0:["$","$L1",null,{}]\n1:I["./logical-components/sections/vertical-list/vertical-list.tsx",["c"],"VerticalList"]'));

    const page = await pages.getPage("category-tree-root");

    expect(page.format).toBe("rsc");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("getFusionPage and getRscPayload throw an UnexpectedPageFormatError for the other format", async () => {
    mockFetch.mockResolvedValueOnce(response('0:{"name":"page"}'));
    await expect(pages.getFusionPage("category-tree-root")).rejects.toMatchObject({ pageId: "category-tree-root", receivedFormat: "rsc" });

    mockFetch.mockResolvedValueOnce(response({ layout: {} }));
    await expect(pages.getRscPayload("home_page_root")).rejects.toBeInstanceOf(UnexpectedPageFormatError);
  });

  it("runServerAction posts the arguments as params with the page version", async () => {
    mockFetch.mockResolvedValue(response('0:["$","$L1",null,{}]'));

    await pages.runServerAction("act_fetch_1", [{ searchQuery: "melk" }], "abc123");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/pages/action/act_fetch_1");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ params: '[{"searchQuery":"melk"}]' });
    expect(init.headers.get("x-page-version")).toBe("abc123");
  });

  it("getClientChunk downloads from the bootstrap CDN without the auth key", async () => {
    serve({ "results_a.1": "chunk source" });

    expect(await pages.getClientChunk("results_a.1")).toBe("chunk source");

    const chunkRequest = mockFetch.mock.calls.find(([url]) => url.endsWith(".script.bundle"));
    expect(chunkRequest[1].headers.get("x-picnic-auth")).toBeNull();
    const bootstrapRequest = mockFetch.mock.calls.find(([url]) => url.endsWith("/bootstrap"));
    expect(bootstrapRequest[1].headers.get("x-picnic-auth")).toBe("auth-key");
  });

  it("findServerActionId downloads the candidate chunks in parallel and returns the first match in module order", async () => {
    serve({ "results_a.1": 'runServerAction("act_fetchSearchResults_aaa")', "results_b.1": 'runServerAction("act_fetchSearchResults_bbb")' });

    expect(await pages.findServerActionId(page, "results/index.tsx", "fetchSearchResults")).toBe("act_fetchSearchResults_aaa");

    const chunkUrls = mockFetch.mock.calls.map(([url]) => url).filter((url) => url.endsWith(".script.bundle"));
    // Shared container chunks are skipped and duplicate chunk ids are fetched once.
    expect(chunkUrls).toEqual([`${CDN}/results_a.1.script.bundle`, `${CDN}/results_b.1.script.bundle`]);
  });

  it("findServerActionId caches results per chunk", async () => {
    serve({ "results_a.1": "no action here", "results_b.1": 'runServerAction("act_fetchSearchResults_bbb")' });

    await pages.findServerActionId(page, "results/index.tsx", "fetchSearchResults");
    const requests = mockFetch.mock.calls.length;
    expect(await pages.findServerActionId(page, "results/index.tsx", "fetchSearchResults")).toBe("act_fetchSearchResults_bbb");
    expect(mockFetch.mock.calls.length).toBe(requests);
  });
});
