import PicnicClient from "../src";
import dotenv from "dotenv";

dotenv.config();

let client: PicnicClient;

describe("Product Detail Page", () => {
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

  it("should retrieve the product detail page", async () => {
    const result = await client.getProductDetailsPage("s1001524");

    expect(result).not.toBeNull();
    expect(result.id).toBe("product-details-page-root");
  });
});
