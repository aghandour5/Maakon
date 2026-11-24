import { useState } from "react";
import { useForm } from "react-hook-form";
import { normalizeProfilePhone, profilePhonePattern, type CompleteProfileBodyParams } from "@workspace/api-zod";
import { GOVERNORATES, getDistrictsForGovernorate } from "@workspace/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeProfile } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

interface IndividualProfileStepProps {
  onComplete: () => void;
}

export default function IndividualProfileStep({ onComplete }: IndividualProfileStepProps) {
  const { t, i18n } = useTranslation();
  const areaLabel = (area: string) => i18n.dir() === "rtl" ? t(area) : area;
  const { user, updateUser, logout } = useAuth();
  const [saveError, setSaveError] = useState("");
  
  const { register, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompleteProfileBodyParams>({
    defaultValues: {
      displayName: user?.displayName ?? "",
      phone: user?.phone ?? "",
      governorate: user?.governorate ?? "",
      district: user?.district ?? "",
    },
  });
  const districts = getDistrictsForGovernorate(watch("governorate"));

  const onSubmit = async (data: CompleteProfileBodyParams) => {
    setSaveError("");
    try {
      const res = await completeProfile(data);
      updateUser(res.user);
      onComplete();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("req_failed"));
    }
  };

  if (!user?.email || !user.emailVerified) {
    return <div className="space-y-4 text-center">
      <p>{t("profile_verify_email")}</p>
      <Button onClick={() => void logout()}>{t("logout")}</Button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("profile_subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">{t("profile_name_label")}</Label>
          <Input 
            id="displayName" 
            placeholder={t("profile_name_placeholder")} 
            autoComplete="name" maxLength={50} required
            {...register("displayName", {
              validate: (name) => name.trim().length >= 2 || t("min_length", { min: 2 }),
            })}
            autoFocus
          />
          {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{t("profile_email")}</Label>
          <Input id="profile-email" type="email" dir="ltr" value={user.email} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">{t("profile_phone")}</Label>
          <Input id="profile-phone" type="tel" autoComplete="tel" dir="ltr" placeholder="+961 70 123 456" required
            {...register("phone", {
              validate: (phone) => profilePhonePattern.test(normalizeProfilePhone(phone)) || t("profile_phone_format"),
            })} />
          {errors.phone && <p role="alert" className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-governorate">{t("governorate")}</Label>
          <select id="profile-governorate" required className="w-full rounded-md border p-2"
            {...register("governorate", { onChange: () => setValue("district", "") })}>
            <option value="" disabled>{t("select_placeholder")}</option>
            {GOVERNORATES.map((area) => <option key={area} value={area}>{areaLabel(area)}</option>)}
          </select>
        </div>
        {districts.length > 0 && <div className="space-y-2">
          <Label htmlFor="profile-district">{t("profile_district_optional")}</Label>
          <select id="profile-district" className="w-full rounded-md border p-2" {...register("district")}>
            <option value="">{t("select_placeholder")}</option>
            {districts.map((area) => <option key={area} value={area}>{areaLabel(area)}</option>)}
          </select>
        </div>}
        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? t("saving") : t("complete_profile")}
        </Button>
      </form>
    </div>
  );
}
