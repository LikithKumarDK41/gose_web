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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BrandLogo from "@/components/nav/BrandLogo";
import LanguageToggle from "@/components/theme/LanguageToggle";

import { useAppDispatch, useAppSelector } from '@/lib/store/hook';
import {
  signin,
  sendEmailOtp,
  verifyOtp,
  registerNewUser,
  prepareSocialRegistration,
  setOtpMode,
  fetchCountries,
  resetOtpState,
} from '@/lib/store/slices/authSlice';
import type { AccountType, Country } from "@/lib/types/userAuth.types";
import { auth, loginWithGoogle, loginWithFacebook } from '@/lib/firebase';

/* ⭐ Translation Hook */
import { useLocale } from "@/providers/LocaleProvider";

type OtpMode = 'login' | 'register';
type FieldErrors = Record<string, string>;

/** Infer country code from phone */
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
  const { t } = useLocale(); // ⭐ Translation hook
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [profilePreview, setProfilePreview] = React.useState<string>("");

  const dispatch = useAppDispatch();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

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

  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
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

  /* ------------------- VALIDATION ------------------- */

  function validateIdentifier(): boolean {
    const errs: FieldErrors = {};
    if (!email.trim()) errs.email = t("auth.error_email_required");
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      errs.email = t("auth.error_email_invalid");
    setIdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateOtp(): boolean {
    const errs: FieldErrors = {};
    if (!otp.trim()) errs.otp = t("auth.error_otp_required");
    else if (!/^\d{4,8}$/.test(otp.trim()))
      errs.otp = t("auth.error_otp_invalid");
    setOtpErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRegister(): boolean {
    const errs: FieldErrors = {};

    if (!name.trim()) errs.name = t("auth.error_name_required");
    if (!gender.trim()) errs.gender = t("auth.error_gender_required");
    if (!agegroup.trim()) errs.agegroup = t("auth.error_age_required");
    if (!country.trim()) errs.country = t("auth.error_country_required");
    if (!nationality.trim()) errs.nationality = t("auth.error_nationality_required");

    if (!emailReg.trim()) errs.emailReg = t("auth.error_email_required");
    else if (!/^\S+@\S+\.\S+$/.test(emailReg.trim()))
      errs.emailReg = t("auth.error_email_invalid");

    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) errs.phoneNumber = t("auth.error_phone_required");
    else if (digits.length < 6) errs.phoneNumber = t("auth.error_phone_invalid");

    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* --------------------- SUBMIT LOGIC --------------------- */

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    /* ---------- LOGIN ---------- */
    if (activeTab === 'login') {
      if (!validateIdentifier()) return;

      const signAction = await dispatch(signin({ email: email.trim() }));
      if (signin.fulfilled.match(signAction)) {
        toast.success(t("auth.toast_login_success"));
        return router.replace(next);
      }
      toast.error(t("auth.toast_login_failed"));
      return;
    }

    /* ---------- REGISTER (SOCIAL) ---------- */
    if (showSocialRegister) {
      if (!validateRegister()) return;

      const payload = {
        state: "active" as const,
        email: emailReg.trim(),
        account: accountLabel(),
        name: name.trim(),
        gender: gender.trim(),
        agegroup: agegroup.trim(),
        country: country.trim(),
        nationality: nationality.trim(),
        phoneNumber: String(phoneNumber.replace(/\D/g, "")),
        firebaseUserId: "",
      };

      const regAction = await dispatch(registerNewUser(payload));



      if (registerNewUser.fulfilled.match(regAction)) {
        toast.success(t("auth.toast_register_success"));
        return router.replace(next);
      }
      toast.error(t("auth.toast_register_failed"));
      return;
    }

    /* ---------- NORMAL EMAIL REGISTER (OTP FLOW) ---------- */

    if (!otpServer) {
      const otpAction = await dispatch(sendEmailOtp({ emailid: emailReg.trim() }));

      if (sendEmailOtp.fulfilled.match(otpAction)) {
        toast.success(t("auth.toast_otp_sent"));
      } else {
        toast.error(t("auth.toast_otp_failed"));
      }
      return;
    }

    if (otpSent && !otpVerified) {
      if (!validateOtp()) return;

      const action = await dispatch(
        verifyOtp({ mode: 'email', target: emailReg.trim(), otp: otp.trim() })
      );

      if (verifyOtp.fulfilled.match(action)) {
        toast.success(t("auth.toast_otp_verified"));
      } else {
        toast.error(t("auth.error_otp_invalid"));
      }
      return;
    }

    /* ---------- FINAL REGISTER ---------- */
    if (otpVerified) {
      if (!validateRegister()) return;

      const payload = {
        state: 'active' as const,
        email: emailReg.trim(),
        account: accountLabel(),
        name: name.trim(),
        gender: gender.trim(),
        agegroup: agegroup.trim(),
        country: country.trim(),
        nationality: nationality.trim(),
        phoneNumber: String(phoneNumber.replace(/\D/g, '')) || "",
        firebaseUserId: '',
      };

      const regAction = await dispatch(registerNewUser(payload));

      if (registerNewUser.fulfilled.match(regAction)) {
        toast.success(t("auth.toast_register_success"));
        router.replace(next);
      } else {
        toast.error(t("auth.toast_register_failed"));
      }
    }
  }

  /* ----------------------- SOCIAL LOGIN ----------------------- */

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

      setLocalFirebaseUid(uid);

      if (!emailFromSocial) {
        toast.error(t("auth.toast_social_email_missing"));
        return;
      }

      let signAction;
      try {
        signAction = await dispatch(signin({ email: emailFromSocial }));
      } catch { }

      if (signAction && signin.fulfilled.match(signAction)) {
        toast.success(t("auth.toast_login_success"));
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
            account: account as AccountType,
            emailid: emailFromSocial,
            firebaseUserId: uid,
          })
        );

        setSocialProvider(provider);
        setShowSocialRegister(true);
        setActiveTab('register');
        dispatch(setOtpMode(null));
        dispatch(resetOtpState());

        toast.success(t("auth.toast_social_complete"));
        return;
      }

      toast.error(t("auth.toast_login_failed"));
    } catch {
      toast.error(t("auth.toast_login_failed"));
    }
  }

  /* ------------------- SOCIAL REGISTER ------------------- */

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

      setLocalFirebaseUid(uid);

      if (!emailFromSocial) {
        toast.error(t("auth.toast_social_email_missing"));
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
          account: account as AccountType,
          emailid: emailFromSocial,
          firebaseUserId: uid,
        })
      );

      setActiveTab('register');
      setSocialProvider(provider);
      setShowSocialRegister(true);
      dispatch(setOtpMode(null));
      dispatch(resetOtpState());

      toast.success(t("auth.toast_social_complete"));
    } catch {
      toast.error(t("auth.toast_login_failed"));
    }
  }

  /* ------------------- JSX UI ------------------- */

  return (
    <main className="min-h-dvh bg-inherit text-inherit">
      <div className="container mx-auto max-w-2xl px-4 py-10 md:py-14">
        <Card className="w-full border border-inherit bg-inherit rounded-2xl shadow-xl">
          <CardHeader className="relative space-y-6 text-center">

            {/* 🌐 Locale Switcher — Top Right */}
            <div className="absolute top-[-15px] right-2 z-10">
              <LanguageToggle />
            </div>

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

              <p className="mt-2 text-lg font-semibold
                bg-gradient-to-r from-[#6EE7B7] via-[#3B82F6] to-[#9333EA]
                bg-clip-text text-transparent"
              >
                {t("auth.welcome_title")}
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
                  {t("auth.tab_login")}
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
                  {t("auth.tab_register")}
                </TabsTrigger>
              </TabsList>

              {/* ---------- LOGIN TAB ---------- */}
              <TabsContent value="login">
                <form className="grid gap-4" onSubmit={onSubmit} noValidate>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      {t("auth.label_email")}
                    </Label>

                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.placeholder_email")}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (idErrors.email) setIdErrors((p) => ({ ...p, email: '' }));
                      }}
                      onBlur={validateIdentifier}
                      disabled={loading}
                    />

                    {idErrors.email && (
                      <p className="text-xs text-red-600">{idErrors.email}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? t("auth.please_wait") : t("auth.btn_login")}
                  </Button>

                  {/* Social login */}
                  <div className="flex items-center gap-3 pt-6">
                    <Separator className="flex-1" />
                    <span className="text-sm uppercase tracking-wide opacity-70">
                      {t("auth.label_or_continue_with")}
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
                      <Mail className="mr-2 size-5" /> {t("auth.btn_continue_google")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full h-12"
                      type="button"
                      onClick={() => handleSocial('facebook')}
                      disabled={loading}
                    >
                      <Facebook className="mr-2 size-5" /> {t("auth.btn_continue_facebook")}
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
                        <Label htmlFor="emailReg">
                          {t("auth.label_email")}
                        </Label>
                        <Input
                          id="emailReg"
                          type="email"
                          placeholder={t("auth.placeholder_email")}
                          value={emailReg}
                          onChange={(e) => setEmailReg(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("auth.please_wait") : t("auth.btn_send_otp")}
                      </Button>
                    </>
                  )}

                  {/* STEP 2 – OTP */}
                  {otpServer && !otpVerified && !showSocialRegister && (
                    <>
                      <div className="grid gap-2">
                        <Label>{t("auth.label_email")}</Label>
                        <Input type="email" value={emailReg} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="otp">{t("auth.label_otp")}</Label>
                        <Input
                          id="otp"
                          type="text"
                          inputMode="numeric"
                          placeholder={t("auth.placeholder_otp")}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          disabled={loading}
                        />
                        {otpErrors.otp && (
                          <p className="text-xs text-red-600">{otpErrors.otp}</p>
                        )}
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("auth.please_wait") : t("auth.btn_verify_otp")}
                      </Button>
                    </>
                  )}

                  {/* STEP 3 – Registration Form */}
                  {(otpVerified || showSocialRegister) && (
                    <>
                      <div className="grid gap-2">
                        <Label>{t("auth.label_email")}</Label>
                        <Input type="email" value={emailReg} disabled />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="name">{t("auth.label_name")} *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={loading}
                        />
                        {regErrors.name && <p className="text-xs text-red-600">{regErrors.name}</p>}
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("auth.label_gender")} *</Label>
                        <Select
                          value={gender}
                          onValueChange={(v) => setGender(v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("auth.label_gender")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{t("auth.gender_male")}</SelectItem>
                            <SelectItem value="female">{t("auth.gender_female")}</SelectItem>
                            <SelectItem value="other">{t("auth.gender_other")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {regErrors.gender && <p className="text-xs text-red-600">{regErrors.gender}</p>}
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("auth.label_age_group")} *</Label>
                        <Select
                          value={agegroup}
                          onValueChange={(v) => setAgegroup(v)}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("auth.label_age_group")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10s">{t("auth.age_10s")}</SelectItem>
                            <SelectItem value="20s">{t("auth.age_20s")}</SelectItem>
                            <SelectItem value="30s">{t("auth.age_30s")}</SelectItem>
                            <SelectItem value="40s">{t("auth.age_40s")}</SelectItem>
                            <SelectItem value="50s">{t("auth.age_50s")}</SelectItem>
                            <SelectItem value="60s">{t("auth.age_60s")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {regErrors.agegroup && <p className="text-xs text-red-600">{regErrors.agegroup}</p>}
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("auth.label_country")} *</Label>
                        <Select
                          value={country}
                          onValueChange={setCountry}
                          disabled={loading || countriesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("auth.label_country")} />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label htmlFor="nationality">{t("auth.label_nationality")} *</Label>
                        <Input
                          id="nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          disabled={loading}
                        />
                        {regErrors.nationality && <p className="text-xs text-red-600">{regErrors.nationality}</p>}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">{t("auth.label_phone")} *</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          inputMode="numeric"
                          placeholder={t("auth.placeholder_phone")}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          disabled={loading}
                        />
                        {regErrors.phoneNumber && <p className="text-xs text-red-600">{regErrors.phoneNumber}</p>}
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("auth.please_wait") : t("auth.btn_register")}
                      </Button>
                    </>
                  )}

                  {!showSocialRegister && (
                    <>
                      <div className="flex items-center gap-3 pt-6">
                        <Separator className="flex-1" />
                        <span className="text-sm uppercase tracking-wide opacity-70">
                          {t("auth.label_or_continue_with")}
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
                          <Mail className="mr-2 size-5" /> {t("auth.btn_continue_google")}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-12"
                          type="button"
                          onClick={() => handleSocialRegister('facebook')}
                          disabled={loading}
                        >
                          <Facebook className="mr-2 size-5" /> {t("auth.btn_continue_facebook")}
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
              {t("auth.label_terms_text")}{' '}
              <Link href="/terms" className="underline">{t("auth.label_terms")}</Link>{' '}
              {t("auth.label_privacy_connector")}{' '}
              <Link href="/privacy" className="underline">{t("auth.label_privacy")}</Link>
            </p>
          </CardFooter>

        </Card>
      </div>
    </main>
  );
}
