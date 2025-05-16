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
    expect(result[0].id).toContain("s1");
    expect(result[0].name).toContain("Affligem blond");
  });
});
