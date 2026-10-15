import PicnicClient from "../..";

let client: PicnicClient;

beforeAll(() => {
  client = new PicnicClient({ authKey: process.env.PICNIC_AUTH_KEY });
});

describe("App - getPage", () => {
  it("should retrieve a Fusion page", async () => {
    const page = await client.app.getPage("home_page_root");

    expect(page).not.toBeNull();
    expect(typeof page).toBe("object");
  });

  it("should throw an UnexpectedPageFormatError for a page served as RSC", async () => {
    await expect(client.app.getPage("category-tree-root")).rejects.toMatchObject({
      name: "UnexpectedPageFormatError",
      pageId: "category-tree-root",
      receivedFormat: "rsc",
    });
  });
});

describe("App - getRscPage", () => {
  it("should retrieve and parse a page served as RSC", async () => {
    const page = await client.app.getRscPage("category-tree-root");

    expect(Object.keys(page.rows).length).toBeGreaterThan(0);
    expect(Object.keys(page.modules).length).toBeGreaterThan(0);
    expect(JSON.stringify(page.rows)).toContain('"name":"category-tree"');
  });

  it("should throw an UnexpectedPageFormatError for a Fusion page", async () => {
    await expect(client.app.getRscPage("home_page_root")).rejects.toBeInstanceOf(PicnicClient.UnexpectedPageFormatError);
  });
});
