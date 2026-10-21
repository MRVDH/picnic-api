export type LoginInput = {
  key: string;
  secret: string;
  client_id: number;
};

/** The result of `auth.login`. */
export type LoginResult = {
  /** The auth key, which the client also keeps for its next requests. */
  authKey: string;
  userId: string;
  /** True when the login only completes after `auth.verify2FACode`. */
  secondFactorAuthenticationRequired: boolean;
  /** True when the app shows an introduction to two-factor authentication first. */
  showSecondFactorAuthenticationIntro: boolean;
};

/** The JSON body of `POST /user/login`. */
export type RawLoginResponse = {
  user_id: string;
  second_factor_authentication_required: boolean;
  show_second_factor_authentication_intro: boolean;
};

export type Generate2FACodeInput = {
  channel: "SMS" | string;
};

export type Verify2FACodeInput = {
  otp: string;
};

export type Verify2FAResult = {
  authKey: string;
};

export type GeneratePhoneVerificationInput = {
  phone_number: string;
};

export type VerifyPhoneNumberInput = {
  otp: string;
  phone_number: string;
};
