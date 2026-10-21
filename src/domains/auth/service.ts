import crypto from "crypto";
import type HttpClient from "../../http-client";
import { LoginInput, LoginResult, RawLoginResponse, Verify2FAResult, Verify2FACodeInput, Generate2FACodeInput, GeneratePhoneVerificationInput, VerifyPhoneNumberInput } from "./types";

export class AuthService {
  constructor(private http: HttpClient) {}

  /**
   * Logs the user into Picnic to be able to send requests.
   * @param {string} username The username of the Picnic account.
   * @param {string} password The password of the Picnic account.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const secret = crypto.createHash("md5").update(password, "utf8").digest("hex");
    const { data, headers } = await this.http.sendRequestWithHeaders<LoginInput, RawLoginResponse>(
      "POST",
      `/user/login`,
      { key: username, secret, client_id: 30100 },
      { authenticated: false },
    );
    const authKey = headers.get("x-picnic-auth");

    if (!authKey) {
      throw new Error("Login failed: No auth key received.");
    }

    this.http.authKey = authKey;

    return {
      authKey,
      userId: data.user_id,
      secondFactorAuthenticationRequired: data.second_factor_authentication_required,
      showSecondFactorAuthenticationIntro: data.show_second_factor_authentication_intro,
    };
  }

  /**
   * Generates a 2FA code for the user to verify.
   * @param {string} channel The channel to send the code to. 'SMS' is the only known format at the moment.
   */
  generate2FACode(channel: string) {
    return this.http.sendRequest<Generate2FACodeInput, null>("POST", `/user/2fa/generate`, { channel }, { includePicnicHeaders: true });
  }

  /**
   * Verifies the 2FA code and captures the updated auth key from the response.
   * The Picnic API returns a new auth key in the `x-picnic-auth` header after
   * successful 2FA verification (HTTP 204, empty body).
   * @param {string} code The 2FA code to verify.
   */
  async verify2FACode(code: string): Promise<Verify2FAResult> {
    const { headers } = await this.http.sendRequestWithHeaders<Verify2FACodeInput, null>("POST", `/user/2fa/verify`, { otp: code }, { includePicnicHeaders: true });
    const authKey = headers.get("x-picnic-auth");
    if (!authKey) {
      throw new Error("2FA verification failed: No auth key received.");
    }

    this.http.authKey = authKey;

    return { authKey };
  }

  /**
   * Logs the current user out, invalidating the auth key.
   */
  logout() {
    return this.http.sendRequest<null, null>("POST", `/user/logout`);
  }

  /**
   * Generates a phone verification code sent to the user's phone number.
   * @param {string} phoneNumber The phone number to send the verification code to.
   */
  generatePhoneVerificationCode(phoneNumber: string) {
    return this.http.sendRequest<GeneratePhoneVerificationInput, null>("POST", `/user/phone_verification/generate`, { phone_number: phoneNumber });
  }

  /**
   * Verifies a phone number using the code sent to the user.
   * @param {string} phoneNumber The phone number being verified.
   * @param {string} code The verification code received by the user.
   */
  verifyPhoneNumber(phoneNumber: string, code: string) {
    return this.http.sendRequest<VerifyPhoneNumberInput, null>("POST", `/user/phone_verification/verify`, { otp: code, phone_number: phoneNumber });
  }
}
