// src/lib/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

/** ===== Constants ===== */
const AUTH_USER_KEY = "auth_user";

/** ===== Types ===== */
export type AccountType = "Facebook" | "Google" | "OTP" | "Email-OTP";

export interface Country {
  name: string;
  dial_code: string;
  code: string; // e.g., "IN"
}

export interface CountriesResponse {
  contries?: Country[];   // current backend key (typo)
  countries?: Country[];  // future-safe if fixed
}

export interface AuthResponse {
  user: any;
  usertours: any[];
  bookmarks: any[];
  visitedhistories: any[];
}

interface SigninPayload {
  email: string;
}

// Email OTP
interface SendEmailOtpPayload {
  emailid: string;
}
interface SendEmailOtpResponse {
  otp: string;
}

// Phone OTP
interface SendPhoneOtpPayload {
  phonenumber: string;
}
interface SendPhoneOtpResponse {
  otp: string;
}

type OtpMode = "email" | "phone";

interface VerifyOtpPayload {
  mode: OtpMode;
  target: string; // emailid for email, phonenumber for phone
  otp: string;
}

/** === FINAL registration payload (EXACT keys you require) === */
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

/** ===== State ===== */
export interface AuthState {
  data: AuthResponse | null;
  loading: boolean;
  error: string | null;

  otpMode: OtpMode | null;
  otpTarget: string | null;
  otpServer: string | null;
  otpVerified: boolean;

  pendingAccount: AccountType | null;
  pendingEmailid: string | null;
  pendingFirebaseUid: string;

  countries: Country[];
  countriesLoading: boolean;
  countriesError: string | null;
}

const initialState: AuthState = {
  data:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null")
      : null,
  loading: false,
  error: null,

  otpMode: null,
  otpTarget: null,
  otpServer: null,
  otpVerified: false,

  pendingAccount: null,
  pendingEmailid: null,
  pendingFirebaseUid: "",

  countries: [],
  countriesLoading: false,
  countriesError: null,
};

/** ===== Thunks ===== */

export const signin = createAsyncThunk<
  AuthResponse,
  SigninPayload,
  { rejectValue: string }
>("auth/signin", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/v2/signin", payload);
    if ((data as any)?.error === "ERROR_INVALID_USER") {
      return rejectWithValue("ERROR_INVALID_USER");
    }
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Signin failed. Try OTP registration."
    );
  }
});

export const sendEmailOtp = createAsyncThunk<
  { otp: string; target: string },
  { emailid: string },
  { rejectValue: string }
>("auth/sendEmailOtp", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<SendEmailOtpResponse>("/v1/emailotp", payload);
    return { otp: data.otp, target: payload.emailid };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to send Email OTP");
  }
});

export const sendPhoneOtp = createAsyncThunk<
  { otp: string; target: string },
  { phonenumber: string },
  { rejectValue: string }
>("auth/sendPhoneOtp", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<SendPhoneOtpResponse>("/v1/phoneotp", payload);
    return { otp: data.otp, target: payload.phonenumber };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to send Phone OTP");
  }
});

export const verifyOtp = createAsyncThunk<
  { target: string; mode: OtpMode },
  VerifyOtpPayload,
  { state: { auth: AuthState }; rejectValue: string }
>("auth/verifyOtp", async (payload, { getState, rejectWithValue }) => {
  const { auth } = getState();
  const okTarget = auth.otpTarget === payload.target;
  const okOtp = auth.otpServer === payload.otp;
  if (!okTarget || !okOtp) {
    return rejectWithValue("Invalid verification code");
  }
  return { target: payload.target, mode: payload.mode };
});

export const registerNewUser = createAsyncThunk<
  AuthResponse,
  RegisterPayload,
  { rejectValue: string }
>("auth/registerNewUser", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AuthResponse>("/v1/userprofiles", payload);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || "Failed to create user profile"
    );
  }
});

export const prepareSocialRegistration = createAsyncThunk<
  { account: AccountType; emailid: string; firebaseUserId: string },
  { account: AccountType; emailid: string; firebaseUserId: string }
>("auth/prepareSocialRegistration", async (payload) => payload);

export const fetchCountries = createAsyncThunk<
  Country[],
  void,
  { rejectValue: string }
>("auth/fetchCountries", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<CountriesResponse>("/v1/countries");
    const list = (data.contries ?? data.countries ?? []) as Country[];
    const normalized = list.map((c) => ({
      ...c,
      dial_code: (c.dial_code ?? "").toString().replace(/\s+/g, ""),
    }));
    return normalized;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Failed to load countries");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_USER_KEY);
  }
  return true;
});

/** ===== Slice ===== */
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.data = null;
      state.error = null;
      state.loading = false;

      state.otpMode = null;
      state.otpTarget = null;
      state.otpServer = null;
      state.otpVerified = false;

      state.pendingAccount = null;
      state.pendingEmailid = null;
      state.pendingFirebaseUid = "";
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    },
    setOtpMode(state, action: { payload: OtpMode | null }) {
      state.otpMode = action.payload;
    },
  },
  extraReducers: (b) => {
    b.addCase(signin.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(signin.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.data = payload;
    });
    b.addCase(signin.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Signin failed";
    });

    b.addCase(sendEmailOtp.pending, (s, a) => {
      s.loading = true;
      s.error = null;
      s.otpMode = "email";
      s.otpTarget = a.meta.arg.emailid;
      s.otpServer = null;
      s.otpVerified = false;
    });
    b.addCase(sendEmailOtp.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.otpServer = payload.otp;
      s.otpTarget = payload.target;
      s.otpMode = "email";
    });
    b.addCase(sendEmailOtp.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to send Email OTP";
      s.otpServer = null;
      s.otpVerified = false;
    });

    b.addCase(sendPhoneOtp.pending, (s, a) => {
      s.loading = true;
      s.error = null;
      s.otpMode = "phone";
      s.otpTarget = a.meta.arg.phonenumber;
      s.otpServer = null;
      s.otpVerified = false;
    });
    b.addCase(sendPhoneOtp.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.otpServer = payload.otp;
      s.otpTarget = payload.target;
      s.otpMode = "phone";
    });
    b.addCase(sendPhoneOtp.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Failed to send Phone OTP";
      s.otpServer = null;
      s.otpVerified = false;
    });

    b.addCase(verifyOtp.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(verifyOtp.fulfilled, (s) => {
      s.loading = false;
      s.otpVerified = true;
    });
    b.addCase(verifyOtp.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "Invalid verification code";
      s.otpVerified = false;
    });

    b.addCase(registerNewUser.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(registerNewUser.fulfilled, (s, { payload }) => {
      s.loading = false;
      s.data = payload;

      s.otpMode = null;
      s.otpTarget = null;
      s.otpServer = null;
      s.otpVerified = false;

      s.pendingAccount = null;
      s.pendingEmailid = null;
      s.pendingFirebaseUid = "";
    });
    b.addCase(registerNewUser.rejected, (s, { payload }) => {
      s.loading = false;
      s.error = payload || "User registration failed";
    });

    b.addCase(prepareSocialRegistration.fulfilled, (s, { payload }) => {
      s.pendingAccount = payload.account;
      s.pendingEmailid = payload.emailid || null;
      s.pendingFirebaseUid = payload.firebaseUserId || "";
    });

    b.addCase(fetchCountries.pending, (s) => {
      s.countriesLoading = true;
      s.countriesError = null;
    });
    b.addCase(fetchCountries.fulfilled, (s, { payload }) => {
      s.countriesLoading = false;
      s.countries = payload;
    });
    b.addCase(fetchCountries.rejected, (s, { payload }) => {
      s.countriesLoading = false;
      s.countriesError = payload || "Failed to load countries";
    });

    b.addCase(logout.fulfilled, (s) => {
      s.data = null;
      s.error = null;
      s.loading = false;

      s.otpMode = null;
      s.otpTarget = null;
      s.otpServer = null;
      s.otpVerified = false;

      s.pendingAccount = null;
      s.pendingEmailid = null;
      s.pendingFirebaseUid = "";

      s.countries = [];
      s.countriesLoading = false;
      s.countriesError = null;
    });
  },
});

export const { clearAuth, setOtpMode } = slice.actions;
export default slice.reducer;
