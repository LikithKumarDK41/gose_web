// src/services/userAuthservice.ts
import api from "@/lib/api";

import type { AccountType, Country } from "@/lib/types/userAuth.types";

/* ------------------------------------------------------------
   🔐 Constants
------------------------------------------------------------ */
export const AUTH_USER_KEY = "auth_user";

export interface CountriesResponse {
  contries?: Country[];   // legacy key from backend
  countries?: Country[];  // future key (fixed spelling)
}

export interface AuthResponse {
  user: any;
  usertours: any[];
  bookmarks: any[];
  visitedhistories: any[];
}

export interface SigninPayload {
  email: string;
}

export interface SendEmailOtpPayload {
  emailid: string;
}

export interface SendEmailOtpResponse {
  otp: string;
}

export interface SendPhoneOtpPayload {
  phonenumber: string;
}

export interface SendPhoneOtpResponse {
  otp: string;
}

export interface RegisterPayload {
  state: "active" | "inactive";
  email: string;
  account: AccountType;
  name: string;
  gender: string;
  agegroup: string;
  country: string;
  nationality: string;
  phoneNumber: number;
  firebaseUserId: string;
}

/* ------------------------------------------------------------
   ⚙️ Helpers
------------------------------------------------------------ */
function parseAxiosError(err: any, fallback: string): string {
  return err?.response?.data?.message || err?.message || fallback;
}

function normalizeCountries(resp: CountriesResponse): Country[] {
  const list = (resp.contries ?? resp.countries ?? []) as Country[];
  return list.map((c) => ({
    ...c,
    dial_code: (c.dial_code ?? "").toString().replace(/\s+/g, ""),
  }));
}

/* ------------------------------------------------------------
   💾 Local Storage Helpers
------------------------------------------------------------ */
export function getPersistedUser(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function persistUser(data: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
}

export function clearPersistedUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_KEY);
}

/* ------------------------------------------------------------
   🌐 API Services (Token + Locale handled globally by api.ts)
------------------------------------------------------------ */

export async function apiSignin(payload: SigninPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/v2/signin", payload);
    return data;
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Signin failed. Try OTP registration."));
  }
}

export async function apiSendEmailOtp(
  payload: SendEmailOtpPayload
): Promise<{ otp: string; target: string }> {
  try {
    const { data } = await api.post<SendEmailOtpResponse>("/v1/emailotp", payload);
    return { otp: data.otp, target: payload.emailid };
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to send Email OTP"));
  }
}

export async function apiSendPhoneOtp(
  payload: SendPhoneOtpPayload
): Promise<{ otp: string; target: string }> {
  try {
    const { data } = await api.post<SendPhoneOtpResponse>("/v1/phoneotp", payload);
    return { otp: data.otp, target: payload.phonenumber };
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to send Phone OTP"));
  }
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>("/v1/userprofiles", payload);
    return data;
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to create user profile"));
  }
}

export async function apiFetchCountries(): Promise<Country[]> {
  try {
    const { data } = await api.get<CountriesResponse>("/v1/countries");
    return normalizeCountries(data);
  } catch (err: any) {
    throw new Error(parseAxiosError(err, "Failed to load countries"));
  }
}
