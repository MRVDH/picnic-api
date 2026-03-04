"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Logs the user into Picnic to be able to send requests.
     * @param {string} username The username of the Picnic account.
     * @param {string} password The password of the Picnic account.
     */
    async login(username, password) {
        const secret = crypto_1.default.createHash("md5").update(password, "utf8").digest("hex");
        const response = await fetch(`${this.http.url}/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: username, secret, client_id: 30100 }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Login failed: ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const authKey = response.headers.get("x-picnic-auth");
        if (!authKey) {
            throw new Error("Login failed: No auth key received.");
        }
        this.http.authKey = authKey;
        return {
            authKey,
            second_factor_authentication_required: data.second_factor_authentication_required,
            show_second_factor_authentication_intro: data.show_second_factor_authentication_intro,
            user_id: data.user_id,
        };
    }
    /**
     * Generates a 2FA code for the user to verify.
     * @param {string} channel The channel to send the code to. 'SMS' is the only known format at the moment.
     */
    generate2FACode(channel) {
        return this.http.sendRequest("POST", `/user/2fa/generate`, { channel }, true);
    }
    /**
     * Verifies the 2FA code.
     * @param {string} code The code to verify.
     */
    verify2FACode(code) {
        return this.http.sendRequest("POST", `/user/2fa/verify`, { otp: code }, true);
    }
    /**
     * Logs the current user out, invalidating the auth key.
     */
    logout() {
        return this.http.sendRequest("POST", `/user/logout`);
    }
    /**
     * Generates a phone verification code sent to the user's phone number.
     * @param {string} phoneNumber The phone number to send the verification code to.
     */
    generatePhoneVerificationCode(phoneNumber) {
        return this.http.sendRequest("POST", `/user/phone_verification/generate`, { phone_number: phoneNumber });
    }
    /**
     * Verifies a phone number using the code sent to the user.
     * @param {string} phoneNumber The phone number being verified.
     * @param {string} code The verification code received by the user.
     */
    verifyPhoneNumber(phoneNumber, code) {
        return this.http.sendRequest("POST", `/user/phone_verification/verify`, { otp: code, phone_number: phoneNumber });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=service.js.map