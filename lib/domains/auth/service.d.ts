import type HttpClient from "../../http-client";
import { LoginResult, Verify2FAResult } from "./types";
export declare class AuthService {
    private http;
    constructor(http: HttpClient);
    /**
     * Logs the user into Picnic to be able to send requests.
     * @param {string} username The username of the Picnic account.
     * @param {string} password The password of the Picnic account.
     */
    login(username: string, password: string): Promise<LoginResult>;
    /**
     * Generates a 2FA code for the user to verify.
     * @param {string} channel The channel to send the code to. 'SMS' is the only known format at the moment.
     */
    generate2FACode(channel: string): Promise<null>;
    /**
     * Verifies the 2FA code and captures the updated auth key from the response.
     * The Picnic API returns a new auth key in the `x-picnic-auth` header after
     * successful 2FA verification (HTTP 204, empty body).
     * @param {string} code The 2FA code to verify.
     */
    verify2FACode(code: string): Promise<Verify2FAResult>;
    /**
     * Logs the current user out, invalidating the auth key.
     */
    logout(): Promise<null>;
    /**
     * Generates a phone verification code sent to the user's phone number.
     * @param {string} phoneNumber The phone number to send the verification code to.
     */
    generatePhoneVerificationCode(phoneNumber: string): Promise<null>;
    /**
     * Verifies a phone number using the code sent to the user.
     * @param {string} phoneNumber The phone number being verified.
     * @param {string} code The verification code received by the user.
     */
    verifyPhoneNumber(phoneNumber: string, code: string): Promise<null>;
}
//# sourceMappingURL=service.d.ts.map