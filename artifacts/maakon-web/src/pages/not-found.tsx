import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center p-8 bg-card rounded-3xl shadow-xl border border-border max-w-md w-full mx-4 flex flex-col items-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          الصفحة غير موجودة / Page not found
        </p>
        <Link href="/" className="w-full">
          <Button className="w-full h-12 text-lg hover-elevate bg-primary hover:bg-primary/90">
            العودة للرئيسية / Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
