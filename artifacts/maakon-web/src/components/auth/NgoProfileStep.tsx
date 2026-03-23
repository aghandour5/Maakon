import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeNgoProfile } from "@/lib/auth-api";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMetadata } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function getNgoProfileSchema(t: any) {
  return z.object({
    orgName: z.string().min(2, t("min_length", { min: 2 })).max(100),
    governorate: z.string().min(1, t("required")),
    description: z.string().max(500).optional(),
    phone: z.string().max(20).optional(),
    website: z.string().max(200).optional(),
  });
}

type NgoProfileFormValues = z.infer<ReturnType<typeof getNgoProfileSchema>>;

interface NgoProfileStepProps {
  onComplete: () => void;
}

export default function NgoProfileStep({ onComplete }: NgoProfileStepProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const { data: metadata } = useGetMetadata();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<NgoProfileFormValues>({
    resolver: zodResolver(getNgoProfileSchema(t)),
    defaultValues: {
      orgName: "",
      governorate: "",
      description: "",
      phone: "",
      website: "",
    },
  });

  const onSubmit = async (data: NgoProfileFormValues) => {
    setIsLoading(true);
    try {
      const res = await completeNgoProfile(data);
      updateUser(res.user);
      toast.success(t("req_submitted"));
      onComplete();
    } catch (error: any) {
      toast.error(error.message || t("req_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("ngo_profile_subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2">
        <div className="space-y-2">
          <Label htmlFor="orgName">{t("ngo_profile_name")}</Label>
          <Input 
            id="orgName" 
            placeholder="e.g. Lebanese Red Cross" 
            {...register("orgName")}
            autoFocus
          />
          {errors.orgName && <p className="text-sm text-destructive">{errors.orgName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="governorate">{t("ngo_gov")}</Label>
          <select
            id="governorate"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("governorate")}
          >
            <option value="" disabled>Select governorate</option>
            {metadata?.governorates.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.governorate && <p className="text-sm text-destructive">{errors.governorate.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("ngo_desc_label")}</Label>
          <Textarea 
            id="description" 
            placeholder={t("ngo_desc_placeholder")} 
            {...register("description")}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("ngo_phone")}</Label>
          <Input 
            id="phone" 
            type="tel"
            dir="ltr"
            placeholder="e.g. 01 123 456" 
            {...register("phone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">{t("ngo_website")}</Label>
          <Input 
            id="website" 
            dir="ltr"
            placeholder="https://..." 
            {...register("website")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t("submitting") : t("submit_verify")}
        </Button>
      </form>
    </div>
  );
}
