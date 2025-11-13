'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, UserRound, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandLogo from "@/components/nav/BrandLogo";

import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import {
  signin,
  sendEmailOtp,
  verifyOtp,
  registerNewUser,
  prepareSocialRegistration,
  setOtpMode,
  fetchCountries,
  Country,
  AccountType,
  resetOtpState,
} from '@/lib/store/slices/authSlice';

import { auth, loginWithGoogle, loginWithFacebook } from '@/lib/firebase';

type OtpMode = 'login' | 'register';
type FieldErrors = Record<string, string>;

/** Try to infer a country code (e.g., 'JP') from a +<dial> E.164 number */
function inferCountryFromE164(e164: string, list: Country[]): string | null {
  if (!e164?.startsWith('+')) return null;
  const digits = e164.replace(/\D/g, '');
  const sorted = [...list].filter(c => c.dial_code).sort((a, b) => b.dial_code.length - a.dial_code.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial_code.replace(/\D/g, ''))) return c.code || null;
  }
  return null;
}

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  /** ⭐ FIX: Store Firebase UID locally (never cleared by Redux) */
  const [localFirebaseUid, setLocalFirebaseUid] = React.useState<string>('');

  const [showSocialRegister, setShowSocialRegister] = React.useState(false);
  const [socialProvider, setSocialProvider] = React.useState<'google' | 'facebook' | null>(null);

  const otpVerifiedState = useAppSelector((s) => s.auth.otpVerified);
  const otpServer = useAppSelector((s) => s.auth.otpServer);
  const otpSent = !!otpServer;
  const otpVerified = otpVerifiedState;
  const [hydrated, setHydrated] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'login' | 'register'>('login');

  const {
    loading,
    otpMode,
    pendingAccount,
    pendingEmailid,
    pendingFirebaseUid,
    countries,
    countriesLoading,
  } = useAppSelector((s) => s.auth);

  // identifier & otp
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');

  // registration fields
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [agegroup, setAgegroup] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [nationality, setNationality] = React.useState('');
  const [emailReg, setEmailReg] = React.useState('');

  const [idErrors, setIdErrors] = React.useState<FieldErrors>({});
  const [otpErrors, setOtpErrors] = React.useState<FieldErrors>({});
  const [regErrors, setRegErrors] = React.useState<FieldErrors>({});

  const effectiveEmail = pendingEmailid || email.trim();

  /** account label for normal register */
  function accountLabel(): AccountType {
    if (pendingAccount) return pendingAccount;
    return 'Email_OTP';
  }

  function resetLocalForm() {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch { }

    setEmailReg('');
    setOtp('');
    setName('');
    setGender('');
    setAgegroup('');
    setCountry('');
    setNationality('');
    setPhoneNumber('');
    setRegErrors({});
    setOtpErrors({});
    setShowSocialRegister(false);
    setSocialProvider(null);
  }

  React.useEffect(() => {
    if (hydrated || pendingAccount) return;

    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch { }

    const timer = setTimeout(() => {
      dispatch(setOtpMode(null));
      dispatch(resetOtpState());
      resetLocalForm();
      setHydrated(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [dispatch, hydrated, pendingAccount]);

  const socialPrefilled = pendingAccount && !otpServer && !otpVerified;

  React.useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  /** ---------- Validation ---------- */
  function validateIdentifier(): boolean {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email';
    setIdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateOtp(): boolean {
    const errs: FieldErrors = {};
    if (!otp.trim()) errs.otp = 'OTP is required';
    else if (!/^\d{4,8}$/.test(otp.trim())) errs.otp = 'Enter a valid code';
    setOtpErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRegister(): boolean {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!gender.trim()) errs.gender = 'Gender is required';
    if (!agegroup.trim()) errs.agegroup = 'Age group is required';
    if (!country.trim()) errs.country = 'Country is required';
    if (!nationality.trim()) errs.nationality = 'Nationality is required';

    if (!emailReg.trim()) errs.emailReg = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(emailReg.trim())) errs.emailReg = 'Enter a valid email';

    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) errs.phoneNumber = 'Phone number is required';
    else if (digits.length < 6) errs.phoneNumber = 'Enter a valid phone number';

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /** ------------------------------------------------------------------
   *                  SUBMIT LOGIC
   * ------------------------------------------------------------------ */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    /** ---------- LOGIN TAB ---------- */
    if (activeTab === 'login') {
      if (!validateIdentifier()) return;

      const val = email.trim();
      const signAction = await dispatch(signin({ email: val }));

      if (signin.fulfilled.match(signAction)) {
        toast.success('Signed in successfully');
        return router.replace(next);
      }

      toast.error(String(signAction.payload || 'Login failed. Please check your email.'));
      return;
    }

    /** ---------- REGISTER TAB ---------- */

    /** ⭐ SOCIAL REGISTER SUBMIT (NO OTP) */
    if (showSocialRegister) {
      if (!validateRegister()) return;

      const phoneNumParsed = Number(phoneNumber.replace(/\D/g, '')) || 0;

      const payload = {
        state: 'active' as const,
        email: emailReg.trim(),
        account:
          socialProvider === 'google'
            ? ('Google' as AccountType)
            : socialProvider === 'facebook'
              ? ('Facebook' as AccountType)
              : accountLabel(),
        name: name.trim(),
        gender: gender.trim(),
        agegroup: agegroup.trim(),
        country: country.trim(),
        nationality: nationality.trim(),
        phoneNumber: phoneNumParsed,

        /** ⭐ FIX: Always use localFirebaseUid */
        firebaseUserId: localFirebaseUid,
      };

      const regAction = await dispatch(registerNewUser(payload));

      if (registerNewUser.fulfilled.match(regAction)) {
        toast.success('Account created. Please Login!');
        return router.replace(next);
      }
      toast.error(String(regAction.payload || 'User registration failed'));
      return;
    }

    /** ⭐ NORMAL EMAIL REGISTER WITH OTP */
    if (!otpServer) {
      if (!emailReg.trim()) {
        toast.error('Enter a valid email before sending OTP');
        return;
      }

      const otpAction = await dispatch(sendEmailOtp({ emailid: emailReg.trim() }));
      if (sendEmailOtp.fulfilled.match(otpAction)) {
        toast.success('OTP sent', { description: `We sent a one-time code to ${emailReg}` });
      } else {
        toast.error(String(otpAction.payload || 'Failed to send Email OTP'));
      }
      return;
    }

    if (otpSent && !otpVerified) {
      if (!validateOtp()) return;

      const action = await dispatch(
        verifyOtp({ mode: 'email', target: emailReg.trim(), otp: otp.trim() })
      );

      if (verifyOtp.fulfilled.match(action)) {
        toast.success('OTP verified. Complete your registration.');
      } else {
        toast.error(String(action.payload || 'Invalid verification code'));
      }
      return;
    }

    /** ⭐ FINAL NORMAL REGISTER */
    if (otpVerified) {
      if (!validateRegister()) return;

      const phoneNumParsed = Number(phoneNumber.replace(/\D/g, '')) || 0;

      const payload = {
        state: 'active' as const,
        email: emailReg.trim(),
        account: accountLabel(),
        name: name.trim(),
        gender: gender.trim(),
        agegroup: agegroup.trim(),
        country: country.trim(),
        nationality: nationality.trim(),
        phoneNumber: phoneNumParsed,

        /** ⭐ FIX: OTP register will NOT have Firebase UID */
        firebaseUserId: '',
      };

      const regAction = await dispatch(registerNewUser(payload));

      if (registerNewUser.fulfilled.match(regAction)) {
        toast.success('Account created. You are signed in!');
        router.replace(next);
      } else {
        toast.error(String(regAction.payload || 'User registration failed'));
      }
    }
  }

  /** ------------------------------------------------------------------
   *              SOCIAL LOGIN (LOGIN TAB)
   * ------------------------------------------------------------------ */
  async function handleSocial(provider: 'google' | 'facebook') {
    try {
      const account = provider === 'google' ? 'Google' : 'Facebook';

      if (provider === 'google') await loginWithGoogle();
      else await loginWithFacebook();

      const user = auth.currentUser;
      const emailFromSocial = user?.email || '';
      const uid = user?.uid || '';
      const displayName = user?.displayName || '';
      const phoneFromSocial = user?.phoneNumber || '';

      /** ⭐ FIX: store UID locally */
      setLocalFirebaseUid(uid);

      if (!emailFromSocial) {
        toast.error(`${account} did not return an email. Please use another method.`);
        return;
      }

      let signAction;
      try {
        signAction = await dispatch(signin({ email: emailFromSocial }));
      } catch { }

      if (signAction && signin.fulfilled.match(signAction)) {
        toast.success('Signed in successfully!');
        return router.replace(next);
      }

      const errPayload = signAction?.payload;
      const isNewUser =
        !signAction ||
        errPayload === 'ERROR_INVALID_USER' ||
        (typeof errPayload === 'string' && errPayload.includes('401'));

      if (isNewUser) {
        if (displayName) setName(displayName);
        setEmailReg(emailFromSocial);

        if (phoneFromSocial) {
          setPhoneNumber(phoneFromSocial.replace(/\D/g, ''));
          const inferred = inferCountryFromE164(phoneFromSocial, countries);
          if (inferred) setCountry(inferred);
        }

        await dispatch(
          prepareSocialRegistration({
            account: account as 'Google' | 'Facebook',
            emailid: emailFromSocial,
            firebaseUserId: uid,
          })
        );

        setSocialProvider(provider);
        setShowSocialRegister(true);
        setActiveTab('register');
        dispatch(setOtpMode(null));
        dispatch(resetOtpState());

        toast.success(`${account} authenticated. Please complete registration.`);
        return;
      }

      toast.error(String(errPayload || 'Social sign-in failed. Try again.'));
    } catch (err) {
      console.error(err);
      toast.error('Social sign-in failed. Try again.');
    }
  }

  /** ------------------------------------------------------------------
   *              SOCIAL REGISTER (REGISTER TAB)
   * ------------------------------------------------------------------ */
  async function handleSocialRegister(provider: 'google' | 'facebook') {
    try {
      const account = provider === 'google' ? 'Google' : 'Facebook';

      if (provider === 'google') await loginWithGoogle();
      else await loginWithFacebook();

      const user = auth.currentUser;
      const emailFromSocial = user?.email || '';
      const uid = user?.uid || '';
      const displayName = user?.displayName || '';
      const phoneFromSocial = user?.phoneNumber || '';

      /** ⭐ FIX: store UID locally */
      setLocalFirebaseUid(uid);

      if (!emailFromSocial) {
        toast.error(`${account} did not return an email. Please use another method.`);
        return;
      }

      if (displayName) setName(displayName);
      setEmailReg(emailFromSocial);

      if (phoneFromSocial) {
        setPhoneNumber(phoneFromSocial.replace(/\D/g, ''));
        const inferred = inferCountryFromE164(phoneFromSocial, countries);
        if (inferred) setCountry(inferred);
      }

      await dispatch(
        prepareSocialRegistration({
          account: account as 'Google' | 'Facebook',
          emailid: emailFromSocial,
          firebaseUserId: uid,
        })
      );

      setActiveTab('register');
      setSocialProvider(provider);
      setShowSocialRegister(true);
      dispatch(setOtpMode(null));
      dispatch(resetOtpState());

      toast.success(`${account} authenticated. Please complete registration.`);
    } catch (err) {
      console.error(err);
      toast.error('Social sign-in failed. Try again.');
    }
  }

  return (
    <main className="min-h-dvh bg-inherit text-inherit">
      <div className="container mx-auto max-w-2xl px-4 py-10 md:py-14">
        <Card className="w-full border border-inherit bg-inherit rounded-2xl shadow-xl">
          <CardHeader className="space-y-6 text-center">

            {/* 🌟 Beautiful Logo Block */}
            <div className="flex flex-col items-center">
              <div className="
    p-3
    bg-gradient-to-b from-[#2A2A2A] to-[#1A1A1A]
    rounded-3xl
    shadow-[0_4px_16px_rgba(0,0,0,0.4)]
    border border-white/10
">
                <BrandLogo imgSize={60} showText={false} />
              </div>
              <p
                className="mt-2
   text-lg font-semibold
    bg-gradient-to-r from-[#6EE7B7] via-[#3B82F6] to-[#9333EA]
    bg-clip-text text-transparent 
  "
              >
                Gose City Tours
              </p>

            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'login' | 'register')}
              className="w-full"
            >
              <TabsList
                className="relative mx-auto flex w-fit rounded-full bg-muted/40 p-1 shadow-inner 
             backdrop-blur-md border border-muted-foreground/10"
              >
                <TabsTrigger
                  value="login"
                  className="
      px-6 py-2 rounded-full transition-all duration-300
      text-gray-400
      data-[state=active]:bg-white 
      data-[state=active]:!text-black 
      dark:data-[state=active]:!text-white 
      data-[state=active]:shadow-lg
    "
                >
                  Login
                </TabsTrigger>

                <TabsTrigger
                  value="register"
                  className="
      px-6 py-2 rounded-full transition-all duration-300
      text-gray-400
      data-[state=active]:bg-white 
      data-[state=active]:!text-black
      dark:data-[state=active]:!text-white
      data-[state=active]:shadow-lg
    "
                >
                  Register
                </TabsTrigger>
              </TabsList>

              {/* ---------- LOGIN TAB ---------- */}
              <TabsContent value="login">
                <form className="grid gap-4" onSubmit={onSubmit} noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <UserRound className="size-4 opacity-70" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (idErrors.email)
                          setIdErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      onBlur={validateIdentifier}
                      disabled={loading}
                      aria-invalid={!!idErrors.email}
                      aria-describedby="email-error"
                    />
                    {idErrors.email && (
                      <p id="email-error" className="text-xs text-red-600">
                        {idErrors.email}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Please wait…' : 'Login'}
                  </Button>

                  {/* Social login */}
                  <div className="flex items-center gap-3 pt-6">
                    <Separator className="flex-1" />
                    <span className="text-sm uppercase tracking-wide opacity-70">
                      or continue with
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button
                      variant="outline"
                      className="w-full h-12"
                      type="button"
                      onClick={() => handleSocial('google')}
                      disabled={loading}
                    >
                      <Mail className="mr-2 size-5" /> Google
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12"
                      type="button"
                      onClick={() => handleSocial('facebook')}
                      disabled={loading}
                    >
                      <Facebook className="mr-2 size-5" /> Facebook
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ---------- REGISTER TAB ---------- */}
              <TabsContent value="register">
                <form className="grid gap-4" onSubmit={onSubmit} noValidate>
                  {/* STEP 1 – Email before OTP */}
                  {!otpServer && !otpVerified && !socialPrefilled && !showSocialRegister && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="emailReg" className="flex items-center gap-2">
                          <UserRound className="size-4 opacity-70" /> Email
                        </Label>
                        <Input
                          id="emailReg"
                          type="email"
                          placeholder="you@example.com"
                          value={emailReg}
                          onChange={(e) => setEmailReg(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Please wait…' : 'Send OTP'}
                      </Button>
                    </>
                  )}

                  {/* STEP 2 – OTP */}
                  {otpServer && !otpVerified && !showSocialRegister && (
                    <>
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={emailReg} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          placeholder="Enter code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          disabled={loading}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Please wait…' : 'Verify OTP'}
                      </Button>
                    </>
                  )}

                  {/* STEP 3 – Full form */}
                  {(otpVerified || showSocialRegister) && (
                    <>
                      <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={emailReg} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Gender *</Label>
                        <Select
                          value={gender}
                          onValueChange={(v) => setGender(v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Age group *</Label>
                        <Select
                          value={agegroup}
                          onValueChange={(v) => setAgegroup(v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10s">10s</SelectItem>
                            <SelectItem value="20s">20s</SelectItem>
                            <SelectItem value="30s">30s</SelectItem>
                            <SelectItem value="40s">40s</SelectItem>
                            <SelectItem value="50s">50s</SelectItem>
                            <SelectItem value="60s">60s</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Country *</Label>
                        <Select
                          value={country}
                          onValueChange={(v) => setCountry(v)}
                          disabled={loading || countriesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone number *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          inputMode="numeric"
                          pattern="\d*"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          disabled={loading}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Please wait…' : 'Register & Continue'}
                      </Button>
                    </>
                  )}

                  {/* Social register buttons */}
                  {!showSocialRegister && (
                    <>
                      <div className="flex items-center gap-3 pt-6">
                        <Separator className="flex-1" />
                        <span className="text-sm uppercase tracking-wide opacity-70">
                          or continue with
                        </span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <Button
                          variant="outline"
                          className="w-full h-12"
                          type="button"
                          onClick={() => handleSocialRegister('google')}
                          disabled={loading}
                        >
                          <Mail className="mr-2 size-5" /> Google
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-12"
                          type="button"
                          onClick={() => handleSocialRegister('facebook')}
                          disabled={loading}
                        >
                          <Facebook className="mr-2 size-5" /> Facebook
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center text-xs opacity-70">
            <p>
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline">Terms</Link> and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
