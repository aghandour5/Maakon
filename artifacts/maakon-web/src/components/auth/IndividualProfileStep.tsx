import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeProfile } from "@/lib/auth-api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function getProfileSchema(t: any) {
  return z.object({
    displayName: z.string().min(2, t("min_length", { min: 2 })).max(50),
  });
}
type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

interface IndividualProfileStepProps {
  onComplete: () => void;
}

export default function IndividualProfileStep({ onComplete }: IndividualProfileStepProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: { displayName: "" },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const res = await completeProfile(data);
      updateUser(res.user);
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

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
            {...register("displayName")}
            autoFocus
          />
          {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("complete_profile")
          )}
        </Button>
      </form>
    </div>
  );
}
