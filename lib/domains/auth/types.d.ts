export type LoginInput = {
    key: string;
    secret: string;
    client_id: number;
};
export type LoginResult = {
    user_id: string;
    second_factor_authentication_required: boolean;
    show_second_factor_authentication_intro: boolean;
    authKey: string;
};
export type Generate2FACodeInput = {
    channel: "SMS" | string;
};
export type Verify2FACodeInput = {
    otp: string;
};
export type GeneratePhoneVerificationInput = {
    phone_number: string;
};
export type VerifyPhoneNumberInput = {
    otp: string;
    phone_number: string;
};
//# sourceMappingURL=types.d.ts.map