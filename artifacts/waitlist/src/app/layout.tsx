import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "معكن - قريبًا",
  description: "معكن تساعد الناس في الوصول إلى الدعم بشكل أسرع. انضم إلى قائمة الانتظار الآن.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-cairo bg-slate-50 text-slate-900 selection:bg-green-100" suppressHydrationWarning>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
