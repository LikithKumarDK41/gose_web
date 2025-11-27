export type AccountType = "Facebook" | "Google" | "OTP" | "Email_OTP";

export interface Country {
  name: string;
  dial_code: string;
  code: string;
}

export type OtpMode = "email" | "phone";
