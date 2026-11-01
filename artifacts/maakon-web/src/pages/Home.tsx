import { useTranslation } from "react-i18next";
import Footer from "@/components/layout/Footer";
import NavigationBar from "@/components/home/NavigationBar";
import HeroSection from "@/components/home/HeroSection";
import ActionButtons from "@/components/home/ActionButtons";
import ViewMapButton from "@/components/home/ViewMapButton";
import ValueProposition from "@/components/home/ValueProposition";
import QuickLinks from "@/components/home/QuickLinks";

export default function Home() {
  const { i18n } = useTranslation();

  return (
    <div
      className="min-h-dvh flex flex-col relative home-bg-container"
    >
      {/*
        Performance: the background is static on purpose. Animating background-position
        on a blended image forced a full-viewport repaint on every frame.
        The 960px WebP is served on mobile, the 1920px WebP on larger screens.
      */}
      <style>{`
        .home-bg-container {
          --home-bg-overlay: linear-gradient(135deg, rgba(1,15,10,0.85) 0%, rgba(5, 46, 35, 0.8) 50%, rgba(1,15,10,0.9) 100%);
          background-image: var(--home-bg-overlay), url('/Lebanon-Background-1920.webp');
          background-size: 200% 200%, cover;
          background-repeat: no-repeat;
          background-blend-mode: multiply;
          background-position: 0% 0%, center;
          position: relative;
        }
        .home-bg-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
        @media (max-width: 640px) {
          .home-bg-container {
            background-image: var(--home-bg-overlay), url('/Lebanon-Background-960.webp');
            background-position: 0% 0%, 60% center;
          }
        }
        /* transform-only animation runs on the GPU compositor (no per-frame repaint) */
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse-subtle {
          box-shadow: 0 10px 40px rgba(220, 38, 38, 0.4);
        }
        @media (prefers-reduced-motion: no-preference) {
          .animate-pulse-subtle {
            animation: pulse-subtle 3s ease-in-out infinite;
          }
        }
        .home-nav-logo .logo-cls-1,
        .home-nav-logo .logo-cls-2,
        .home-nav-logo .logo-cls-3,
        .home-nav-logo .logo-cls-4,
        .home-nav-logo .logo-rtl-cls-1,
        .home-nav-logo .logo-rtl-cls-2,
        .home-nav-logo .logo-rtl-cls-3,
        .home-nav-logo .logo-rtl-cls-4 {
          fill: #fff !important;
        }
      `}</style>
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pb-16 pt-8 sm:pt-14 gap-6">
        {/* Hero Section */}
        <HeroSection />

        {/* Action Buttons */}
        <ActionButtons />

        {/* View Map Button */}
        <ViewMapButton />

        {/* Value Proposition Section */}
        <ValueProposition />

        {/* Quick Links Section */}
        <QuickLinks />
      </main>

      <div className="relative z-10 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}
