import PicnicClient from "../src";
import dotenv from "dotenv";

dotenv.config();

let client: PicnicClient;

describe("Search", () => {
  beforeAll(async () => {
    if (process.env.PICNIC_AUTH_KEY) {
      client = new PicnicClient({
        authKey: process.env.PICNIC_AUTH_KEY,
      });
    } else {
      client = new PicnicClient();
      await client.login(process.env.PICNIC_USERNAME as string, process.env.PICNIC_PASSWORD as string);
    }
  });

  it("should search for a product and return results", async () => {
    const result = await client.search("Affligem blond");

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe("s1001524");
    expect(result[0].name).toBe("Affligem blond");
    expect(result[0].sole_article_id).toBe("11295810");
  });

  it("should get the bundle options for a certain product", async () => {
    const result = await client.getBundleArticleIds("11295810");

    expect(result).toEqual(["s1001524", "s1084031", "s1084032", "s1084033"]);
  });
});
