import PicnicClient from "../src";
import dotenv from "dotenv";

dotenv.config();

let client: PicnicClient;

describe("Auth", () => {
  it("should construct the picnic api client", async () => {
    let error = null;

    try {
      client = new PicnicClient();
    } catch (err) {
      error = err;
    }

    expect(error).toBe(null);
  });

  it("should fail to log the user in due to invalid credentials", async () => {
    let error = null;

    try {
      await client.login("notausername", process.env.PICNIC_PASSWORD as string);
    } catch (err) {
      error = err;
    }

    expect(error).toBe("Login failed: Invalid credentials");
  });

  it("should log the user in successfully", async () => {
    const result = await client.login(process.env.PICNIC_USERNAME as string, process.env.PICNIC_PASSWORD as string);

    expect(result).toBeDefined();
    expect(result.authKey).toBeDefined();
    expect(result.second_factor_authentication_required).toBeDefined();
    expect(result.user_id).toBeDefined();
  });
});
