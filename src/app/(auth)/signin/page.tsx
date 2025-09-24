'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github, Mail, UserRound, Phone, Globe, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import {
  signin,
  sendEmailOtp,
  sendPhoneOtp,
  verifyOtp,
  registerNewUser,
  prepareSocialRegistration,
  setOtpMode,
  fetchCountries,
  Country,
  AccountType,
} from '@/lib/store/slices/authSlice';

import { auth, loginWithGoogle, loginWithFacebook } from '@/lib/firebase';

type Step = 'identifier' | 'otp' | 'register';
type OtpMode = 'email' | 'phone';
type FieldErrors = Record<string, string>;

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const {
    loading,
    error,
    otpMode,
    otpTarget,
    pendingAccount,
    pendingEmailid,
    pendingFirebaseUid,
    countries,
    countriesLoading,
  } = useAppSelector((s) => s.auth);

  React.useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  const [mode, setMode] = React.useState<OtpMode>('email');
  const [step, setStep] = React.useState<Step>('identifier');

  // identifier & OTP
  const [email, setEmail] = React.useState('');
  const [phoneRaw, setPhoneRaw] = React.useState('');
  const [otp, setOtp] = React.useState('');

  // registration (EXACT payload fields)
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [agegroup, setAgegroup] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [nationality, setNationality] = React.useState('');
  const [emailReg, setEmailReg] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');

  // errors & messages
  const [idErrors, setIdErrors] = React.useState<FieldErrors>({});
  const [otpErrors, setOtpErrors] = React.useState<FieldErrors>({});
  const [regErrors, setRegErrors] = React.useState<FieldErrors>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const effectiveEmail = pendingEmailid || email.trim();

  function accountLabel(): AccountType {
    if (pendingAccount) return pendingAccount;
    const m = (otpMode || mode);
    return m === 'email' ? 'Email-OTP' : 'OTP';
  }

  function gotoRegisterPrefill() {
    if (pendingAccount) {
      setEmailReg(effectiveEmail || '');
      setPhoneNumber('');
    } else {
      if ((otpMode || mode) === 'email') {
        setEmailReg(otpTarget || effectiveEmail || '');
        setPhoneNumber('');
      } else {
        const digits = (otpTarget || phoneRaw.trim()).replace(/\D/g, '');
        setPhoneNumber(digits);
        setEmailReg('');
      }
    }
    setStep('register');
  }

  /** ---------- Validation ---------- */
  function validateIdentifier(): boolean {
    const errs: FieldErrors = {};
    if (mode === 'email') {
      if (!email.trim()) errs.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Enter a valid email';
    } else {
      const digits = phoneRaw.replace(/\D/g, '');
      if (!digits) errs.phone = 'Phone number is required';
      else if (digits.length < 6) errs.phone = 'Enter a valid phone number';
    }
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

  /** ---------- Submit ---------- */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    setMessage(null);

    if (step === 'identifier') {
      if (!validateIdentifier()) return;

      if (mode === 'email') {
        const val = email.trim();
        const signAction = await dispatch(signin({ email: val }));
        if (signin.fulfilled.match(signAction)) {
          setMessage('Signed in successfully!');
          return router.replace(next);
        }
        if (signAction.payload === 'ERROR_INVALID_USER') {
          const otpAction = await dispatch(sendEmailOtp({ emailid: val }));
          if (sendEmailOtp.fulfilled.match(otpAction)) {
            setMessage(`We sent a one-time code to ${val}`);
            setStep('otp');
            dispatch(setOtpMode('email'));
          } else {
            setLocalError((otpAction.payload as string) || 'Failed to send Email OTP');
          }
          return;
        }
        return setLocalError((signAction.payload as string) || 'Signin failed. Please try again.');
      }

      // phone flow (digits only)
      const digits = phoneRaw.replace(/\D/g, '');
      const otpAction = await dispatch(sendPhoneOtp({ phonenumber: digits }));
      if (sendPhoneOtp.fulfilled.match(otpAction)) {
        setMessage(`We sent a one-time code to your phone`);
        setStep('otp');
        dispatch(setOtpMode('phone'));
      } else {
        setLocalError((otpAction.payload as string) || 'Failed to send Phone OTP');
      }
      return;
    }

    if (step === 'otp') {
      if (!validateOtp()) return;

      const target =
        (otpMode === 'phone')
          ? (otpTarget || phoneRaw.replace(/\D/g, ''))
          : (otpTarget || effectiveEmail);

      const action = await dispatch(
        verifyOtp({ mode: (otpMode || mode) as OtpMode, target, otp: otp.trim() })
      );
      if (verifyOtp.fulfilled.match(action)) {
        setMessage('OTP verified. Complete your registration.');
        gotoRegisterPrefill();
      } else {
        setLocalError((action.payload as string) || 'Invalid verification code');
      }
      return;
    }

    if (step === 'register') {
      if (!validateRegister()) return;

      const phoneNumParsed = Number(phoneNumber.replace(/\D/g, '')) || 0;

      const payload = {
        state: "active" as const,
        email: emailReg.trim(),
        account: accountLabel(),
        name: name.trim(),
        gender: gender.trim(),
        agegroup: agegroup.trim(),
        country: country.trim(),
        nationality: nationality.trim(),
        phoneNumber: phoneNumParsed,   // digits only, NO country code
        firebaseUserId: pendingAccount ? pendingFirebaseUid : "",
      };

      const regAction = await dispatch(registerNewUser(payload));
      if (registerNewUser.fulfilled.match(regAction)) {
        setMessage('Registration completed and signed in successfully!');
        router.replace(next);
      } else {
        setLocalError((regAction.payload as string) || 'User registration failed');
      }
      return;
    }
  }

  async function handleSocial(provider: 'google' | 'facebook') {
    try {
      const account = provider === 'google' ? 'Google' : 'Facebook';
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithFacebook();
      }
      const user = auth.currentUser;
      const email = user?.email || '';
      const uid = user?.uid || '';

      await dispatch(prepareSocialRegistration({
        account: account as "Google" | "Facebook",
        emailid: email,
        firebaseUserId: uid,
      }));

      setMessage(`${account} authenticated. Please complete registration.`);
      setStep('register');
    } catch (err) {
      console.error(err);
      setLocalError('Social sign-in failed. Try again.');
    }
  }

  const isEmailMode = (otpMode || mode) === 'email';

  return (
    <main className="min-h-dvh bg-inherit text-inherit">
      {/* page container provides vertical breathing room and scrolls naturally */}
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Card className="w-full border border-inherit bg-inherit rounded-2xl shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
            <CardDescription className="text-base">
              {step === 'identifier' &&
                (mode === 'email'
                  ? 'Sign in with your email — or choose a social provider'
                  : 'Sign in with your phone number — we’ll send an OTP')}
              {step === 'otp' &&
                `Enter the verification code sent to ${otpTarget || (isEmailMode ? (pendingEmailid || email) : 'your phone')}`}
              {step === 'register' &&
                `Complete your registration (${accountLabel()})`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Mode switch */}
            {step === 'identifier' && !pendingAccount && (
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant={mode === 'email' ? 'default' : 'outline'}
                  onClick={() => { setMode('email'); setStep('identifier'); setOtp(''); setMessage(null); setLocalError(null); setIdErrors({}); }}
                  disabled={loading}
                >
                  <Mail className="mr-2 size-4" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={mode === 'phone' ? 'default' : 'outline'}
                  onClick={() => { setMode('phone'); setStep('identifier'); setOtp(''); setMessage(null); setLocalError(null); setIdErrors({}); }}
                  disabled={loading}
                >
                  <Phone className="mr-2 size-4" />
                  Phone
                </Button>
              </div>
            )}

            <form className="grid gap-4" onSubmit={onSubmit} noValidate>
              {step === 'identifier' && !pendingAccount && (
                <>
                  {mode === 'email' ? (
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
                          if (idErrors.email) setIdErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        onBlur={validateIdentifier}
                        disabled={loading}
                        aria-invalid={!!idErrors.email}
                        aria-describedby="email-error"
                      />
                      {idErrors.email && (
                        <p id="email-error" className="text-xs text-red-600">{idErrors.email}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="size-4 opacity-70" /> Phone number (digits only)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="e.g., 9876543210"
                        autoComplete="tel"
                        value={phoneRaw}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setPhoneRaw(digits);
                          if (idErrors.phone) setIdErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        onBlur={validateIdentifier}
                        disabled={loading}
                        aria-invalid={!!idErrors.phone}
                        aria-describedby="phone-error"
                      />
                      {idErrors.phone && (
                        <p id="phone-error" className="text-xs text-red-600">{idErrors.phone}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === 'otp' && (
                <div className="grid gap-2">
                  <Label htmlFor="otp">One-time code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={8}
                    placeholder="Enter code"
                    value={otp}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setOtp(digits);
                      if (otpErrors.otp) setOtpErrors({});
                    }}
                    onBlur={validateOtp}
                    disabled={loading}
                    aria-invalid={!!otpErrors.otp}
                    aria-describedby="otp-error"
                  />
                  {otpErrors.otp && (
                    <p id="otp-error" className="text-xs text-red-600">{otpErrors.otp}</p>
                  )}
                  <p className="text-xs opacity-70">
                    Didn’t get the code?{' '}
                    <button
                      type="button"
                      className="underline text-sky-600 dark:text-sky-400"
                      onClick={async () => {
                        setLocalError(null);
                        setMessage(null);
                        if ((otpMode || mode) === 'email') {
                          const resend = await dispatch(sendEmailOtp({ emailid: (otpTarget || pendingEmailid || email).trim() }));
                          if (sendEmailOtp.fulfilled.match(resend)) {
                            setMessage(`We re-sent the code to ${otpTarget || pendingEmailid || email}`);
                          } else {
                            setLocalError((resend.payload as string) || 'Failed to resend Email OTP');
                          }
                        } else {
                          const digits = (otpTarget || phoneRaw).replace(/\D/g, '');
                          const resend = await dispatch(sendPhoneOtp({ phonenumber: digits }));
                          if (sendPhoneOtp.fulfilled.match(resend)) {
                            setMessage(`We re-sent the code to your phone`);
                          } else {
                            setLocalError((resend.payload as string) || 'Failed to resend Phone OTP');
                          }
                        }
                      }}
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </p>
                </div>
              )}

              {step === 'register' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="size-4 opacity-70" /> Name *
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (regErrors.name) setRegErrors((p) => ({ ...p, name: '' })); }}
                      onBlur={validateRegister}
                      disabled={loading}
                      aria-invalid={!!regErrors.name}
                      aria-describedby="name-error"
                    />
                    {regErrors.name && <p id="name-error" className="text-xs text-red-600">{regErrors.name}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label>Gender *</Label>
                    <Select
                      value={gender}
                      onValueChange={(v) => { setGender(v); if (regErrors.gender) setRegErrors((p) => ({ ...p, gender: '' })); }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!regErrors.gender}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      {/* Use popper so the menu isn't clipped by the card */}
                      <SelectContent position="popper" sideOffset={6}>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {regErrors.gender && <p className="text-xs text-red-600">{regErrors.gender}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label>Age group *</Label>
                    <Select
                      value={agegroup}
                      onValueChange={(v) => { setAgegroup(v); if (regErrors.agegroup) setRegErrors((p) => ({ ...p, agegroup: '' })); }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!regErrors.agegroup}>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={6}>
                        <SelectItem value="10s">10s</SelectItem>
                        <SelectItem value="20s">20s</SelectItem>
                        <SelectItem value="30s">30s</SelectItem>
                        <SelectItem value="40s">40s</SelectItem>
                        <SelectItem value="50s">50s</SelectItem>
                        <SelectItem value="60s">60s</SelectItem>
                      </SelectContent>
                    </Select>
                    {regErrors.agegroup && <p className="text-xs text-red-600">{regErrors.agegroup}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="size-4 opacity-70" /> Country *
                    </Label>
                    <Select
                      value={country}
                      onValueChange={(code) => { setCountry(code); if (regErrors.country) setRegErrors((p) => ({ ...p, country: '' })); }}
                      disabled={loading || countriesLoading}
                    >
                      <SelectTrigger className="w-full" aria-invalid={!!regErrors.country}>
                        <SelectValue placeholder={countriesLoading ? "Loading..." : "Select country"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72" position="popper" sideOffset={6}>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {regErrors.country && <p className="text-xs text-red-600">{regErrors.country}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={nationality}
                      onChange={(e) => { setNationality(e.target.value); if (regErrors.nationality) setRegErrors((p) => ({ ...p, nationality: '' })); }}
                      onBlur={validateRegister}
                      disabled={loading}
                      aria-invalid={!!regErrors.nationality}
                      aria-describedby="nat-error"
                    />
                    {regErrors.nationality && <p id="nat-error" className="text-xs text-red-600">{regErrors.nationality}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="emailReg">Email *</Label>
                    <Input
                      id="emailReg"
                      type="email"
                      value={emailReg}
                      onChange={(e) => { setEmailReg(e.target.value); if (regErrors.emailReg) setRegErrors((p) => ({ ...p, emailReg: '' })); }}
                      onBlur={validateRegister}
                      disabled={loading}
                      aria-invalid={!!regErrors.emailReg}
                      aria-describedby="emailReg-error"
                    />
                    {regErrors.emailReg && <p id="emailReg-error" className="text-xs text-red-600">{regErrors.emailReg}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone number (digits only) *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="e.g., 9876543210"
                      value={phoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(digits);
                        if (regErrors.phoneNumber) setRegErrors((p) => ({ ...p, phoneNumber: '' }));
                      }}
                      onBlur={validateRegister}
                      disabled={loading}
                      aria-invalid={!!regErrors.phoneNumber}
                      aria-describedby="phoneNumber-error"
                    />
                    {regErrors.phoneNumber && <p id="phoneNumber-error" className="text-xs text-red-600">{regErrors.phoneNumber}</p>}
                  </div>

                  <p className="text-xs opacity-70">
                    Account: <b>{accountLabel()}</b> &nbsp;|&nbsp; State: <b>active</b>
                  </p>
                </>
              )}

              {(error || localError) && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {localError || error}
                </p>
              )}
              {message && (
                <p className="text-sm text-green-600 dark:text-green-400" role="status">
                  {message}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading
                  ? 'Please wait…'
                  : step === 'identifier'
                    ? (mode === 'email' ? 'Continue' : 'Send OTP')
                    : step === 'otp'
                      ? 'Verify Code'
                      : 'Register & Continue'}
              </Button>

              {step !== 'identifier' && !pendingAccount && (
                <button
                  type="button"
                  className="text-sm underline opacity-80"
                  onClick={() => {
                    if (step === 'register') setStep('otp');
                    else setStep('identifier');
                    setMessage(null);
                    setLocalError(null);
                    setIdErrors({});
                    setOtpErrors({});
                    setRegErrors({});
                  }}
                  disabled={loading}
                >
                  {step === 'register' ? 'Back to OTP' : `Change ${isEmailMode ? 'email' : 'phone'}`}
                </button>
              )}
            </form>

            {/* Social */}
            {step === 'identifier' && !pendingAccount && (
              <>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-sm uppercase tracking-wide opacity-70">
                    or continue with
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Github className="mr-2 size-5" /> Facebook
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center text-xs opacity-70">
            <p>
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
