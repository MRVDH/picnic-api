import PicnicClient from "..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("App - getPage", () => {
  it("should return a Fusion page", async () => {
    const page = await client.app.getPage("home_page_root");

    expect(page.format).toBe("fusion");
    if (page.format !== "fusion") return;
    expect(typeof page.page).toBe("object");
  });

  it("should return a page served as RSC as a component tree", async () => {
    const page = await client.app.getPage("category-tree-root");

    expect(page.format).toBe("rsc");
    if (page.format !== "rsc") return;
    expect(page.content.nodes.length).toBeGreaterThan(0);
    expect(Object.keys(page.content.tokens).length).toBeGreaterThan(0);
    expect(JSON.stringify(page.content.nodes)).toContain('"name":"category-tree"');
  });
});
