import type { Metadata } from "next"; // next 13.4+ supports metadata export for better SEO and performance. This import is used to define the metadata for the page, such as title and description.
import { Cairo } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"; // This import is used to include Vercel's Speed Insights component, which helps analyze and optimize the performance of the application.
import { Analytics } from "@vercel/analytics/next"; // This import is used to include Vercel's Analytics component, which helps track user interactions and gather insights about the application's usage.

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "معكن - قريبًا",
  description: "معكن تساعد الناس في الوصول إلى الدعم بشكل أسرع. انضم إلى قائمة الانتظار الآن.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ // This is the root layout component for the Next.js application. It defines the overall structure of the HTML document, including the language, direction, and styling. It also includes the Speed Insights and Analytics components to enhance performance and track user interactions.
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
