"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hook";
import {
  updateUserProfile,
  uploadProfileImage,
} from "@/lib/store/slices/authSlice";
import { useLocale } from "@/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";

export default function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const dispatch = useAppDispatch();
  const { data, loading, countries, countriesLoading } = useAppSelector(
    (s) => s.auth
  );

  const user = data?.user || null;

  // ------------------------------------
  // FORM STATE (Same fields as Register form)
  // ------------------------------------
  const [form, setForm] = useState({
    name: "",
    email: "",
    gender: "",
    agegroup: "",
    country: "",
    nationality: "",
    // phoneNumber: "",
  });

  // IMAGE STATE
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ------------------------------------
  // PREFILL FORM WHEN MODAL OPENS
  // ------------------------------------
  useEffect(() => {
    if (!user || !countries) return;

    // Gender mapping
    const genderMap: any = {
      男性: "male",
      女性: "female",
      その他: "other",
    };

    // Agegroup mapping (backend → select)
    const ageGroupMap: any = {
      "10-20": "10s",
      "20-30": "20s",
      "30-40": "30s",
      "40-50": "40s",
      "50-60": "50s",
      "60-70": "60s",
    };

    const userCountry =
      typeof user.country === "string" ? user.country : user.country?.name;

    const matchedCountry = countries.find(
      (c) => c.name.toLowerCase() === userCountry?.toLowerCase()
    );

    setForm({
      name: user?.name || "",
      email: user?.email || "",
      gender: genderMap[user?.gender] || user?.gender || "",
      agegroup: ageGroupMap[user?.agegroup] || user?.agegroup || "",
      country: matchedCountry ? matchedCountry.code : "",
      nationality: user?.nationality || "",
      // phoneNumber: user?.phoneNumber || "",
    });

    setPreview(user?.image?.secure_url || user?.image || null);
  }, [user, countries]);

  // ------------------------------------
  // CHANGE HANDLER
  // ------------------------------------
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ------------------------------------
  // SAVE PROFILE
  // ------------------------------------
  const handleSave = async () => {
    if (!user?._id) {
      toast.error(t("profile.userNotFound"));
      return;
    }

    try {
      // Upload image first
      if (imageFile) {
        const fd = new FormData();
        fd.append("_id", user._id); // ✔ backend expects this
        fd.append("image_upload", imageFile); // ✔ backend expects this

        await dispatch(
          uploadProfileImage({
            userId: user._id,
            file: imageFile,
          })
        ).unwrap();
      }

      // Update user fields
      await dispatch(
        updateUserProfile({
          id: user._id,
          payload: form,
        })
      ).unwrap();

      toast.success(t("profile.success"));
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t("profile.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-xl scrollbar-hide">
        <DialogHeader>
          <DialogTitle>{t("profile.editProfile")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="relative group w-32 h-32">
              <img
                src={preview || ""}
                className="w-32 h-32 rounded-full object-cover border border-gray-700 shadow-md transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
              />

              <label
                htmlFor="profileImage"
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 
             text-white flex items-center justify-center text-xs cursor-pointer shadow-sm 
             border border-white/20 transition-all duration-200"
              >
                <Pencil className="w-4 h-4" />
              </label>

              <input
                id="profileImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="grid gap-2">
            <Label>{t("profile.email")}</Label>
            <Input name="email" value={form.email} disabled />
          </div>

          {/* NAME */}
          <div className="grid gap-2">
            <Label>{t("profile.name")} *</Label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* GENDER */}
          <div className="grid gap-2">
            <Label>{t("profile.gender")} *</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => setForm({ ...form, gender: v })}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("profile.selectGender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("profile.gender_male")}</SelectItem>
                <SelectItem value="female">
                  {t("profile.gender_female")}
                </SelectItem>
                <SelectItem value="other">
                  {t("profile.gender_other")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AGE GROUP */}
          <div className="grid gap-2">
            <Label>{t("profile.agegroup")} *</Label>
            <Select
              value={form.agegroup}
              onValueChange={(v) => setForm({ ...form, agegroup: v })}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("profile.selectAgeGroup")} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="10s">{t("profile.age_10s")}</SelectItem>
                <SelectItem value="20s">{t("profile.age_20s")}</SelectItem>
                <SelectItem value="30s">{t("profile.age_30s")}</SelectItem>
                <SelectItem value="40s">{t("profile.age_40s")}</SelectItem>
                <SelectItem value="50s">{t("profile.age_50s")}</SelectItem>
                <SelectItem value="60s">{t("profile.age_60s")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* COUNTRY */}
          <div className="grid gap-2">
            <Label>{t("profile.country")} *</Label>
            <Select
              value={form.country}
              onValueChange={(v) => setForm({ ...form, country: v })}
              disabled={loading || countriesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("profile.selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                {countries?.map((c: any) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NATIONALITY */}
          <div className="grid gap-2">
            <Label>{t("profile.nationality")} *</Label>
            <Input
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* SAVE BUTTON */}
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading ? t("profile.saving") : t("profile.saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
