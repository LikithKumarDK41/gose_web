// src/lib/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  AUTH_USER_KEY,
  // types
  AccountType,
  Country,
  CountriesResponse,
  AuthResponse,
  RegisterPayload,
  SigninPayload,
  // service fns
  apiSignin,
  apiSendEmailOtp,
  apiSendPhoneOtp,
  apiRegister,
  apiFetchCountries,
  getPersistedUser,
  persistUser,
  clearPersistedUser,
} from "@/services/userAuthService";

// Re-export types so existing imports from this slice keep working:
export type { Country, AccountType, AuthResponse, RegisterPayload, SigninPayload };

/** ===== Local-only OTP types (no server calls) ===== */
type OtpMode = "email" | "phone";
interface VerifyOtpPayload {
  mode: OtpMode;
  target: string; // emailid for email, phonenumber for phone
  otp: string;
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
  data: typeof window !== "undefined" ? getPersistedUser() : null,
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

/** ===== Thunks (now delegating to the service) ===== */
export const signin = createAsyncThunk<
  AuthResponse,
  SigninPayload,
  { rejectValue: string }
>("auth/signin", async (payload, { rejectWithValue }) => {
  try {
    const data = await apiSignin(payload);
    if ((data as any)?.error === "ERROR_INVALID_USER") {
      return rejectWithValue("ERROR_INVALID_USER");
    }
    persistUser(data);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Signin failed. Try OTP registration.");
  }
});

export const sendEmailOtp = createAsyncThunk<
  { otp: string; target: string },
  { emailid: string },
  { rejectValue: string }
>("auth/sendEmailOtp", async (payload, { rejectWithValue }) => {
  try {
    const out = await apiSendEmailOtp(payload);
    return out;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to send Email OTP");
  }
});

export const sendPhoneOtp = createAsyncThunk<
  { otp: string; target: string },
  { phonenumber: string },
  { rejectValue: string }
>("auth/sendPhoneOtp", async (payload, { rejectWithValue }) => {
  try {
    const out = await apiSendPhoneOtp(payload);
    return out;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to send Phone OTP");
  }
});

// purely client-side check against otp stored in state
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
    const data = await apiRegister(payload);
    persistUser(data);
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to create user profile");
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
    const list = await apiFetchCountries();
    return list;
  } catch (err: any) {
    return rejectWithValue(err.message || "Failed to load countries");
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  clearPersistedUser();
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


      
      clearPersistedUser();
    },
    resetOtpState(state) {
  state.otpServer = null;
  state.otpVerified = false;
  state.otpTarget = null;
  state.otpMode = null;
  state.pendingAccount = null;
  state.pendingEmailid = null;
  state.pendingFirebaseUid = "";
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
      s.error = (payload as string) || "Signin failed";
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
      s.error = (payload as string) || "Failed to send Email OTP";
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
      s.error = (payload as string) || "Failed to send Phone OTP";
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
      s.error = (payload as string) || "Invalid verification code";
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
      s.error = (payload as string) || "User registration failed";
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
      s.countriesError = (payload as string) || "Failed to load countries";
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

export const { clearAuth, setOtpMode, resetOtpState } = slice.actions;
export default slice.reducer;
