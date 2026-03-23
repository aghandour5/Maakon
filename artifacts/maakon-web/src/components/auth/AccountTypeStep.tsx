import { Button } from "@/components/ui/button";
import { User, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AccountType } from "./AuthModal";

interface AccountTypeStepProps {
  accountType: AccountType;
  setAccountType: (val: AccountType) => void;
  onNext: () => void;
}

export default function AccountTypeStep({ accountType, setAccountType, onNext }: AccountTypeStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => setAccountType("individual")}
          className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
            accountType === "individual" 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/50"
          }`}
        >
          <div className="bg-primary/10 p-2 rounded-full mt-1">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">{t("account_individual")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("indiv_desc")}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setAccountType("ngo")}
          className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-colors ${
            accountType === "ngo" 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/50"
          }`}
        >
          <div className="bg-primary/10 p-2 rounded-full mt-1">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">{t("account_ngo")}</h4>
            <p className="text-sm text-muted-foreground">
              {t("ngo_desc")}
            </p>
          </div>
        </button>
      </div>

      <Button onClick={onNext} className="w-full">
        {t("next")}
      </Button>
    </div>
  );
}
