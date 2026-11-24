import Footer from "@/components/layout/Footer";
import NavigationBar from "@/components/home/NavigationBar";
import HeroSection from "@/components/home/HeroSection";
import ActionButtons from "@/components/home/ActionButtons";
import ViewMapButton from "@/components/home/ViewMapButton";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col relative home-bg-container">
      {/*
        Performance: the background is static on purpose. Animating background-position
        on a blended image forced a full-viewport repaint on every frame.
        The 960px WebP is served on mobile, the 1920px WebP on larger screens.
        Both are rendered from the vector source (Lebanon-Background-3840.svg); the 940 KB SVG is too heavy to use directly.
      */}
      <style>{`
        .home-bg-container {
          --home-bg-overlay: linear-gradient(135deg, rgba(1,15,10,0.75) 0%, rgba(5, 46, 35, 0.68) 50%, rgba(1,15,10,0.82) 100%);
          background-image: var(--home-bg-overlay), url('/lebanon-flag-1920.webp');
          background-color: #fff; /* Matches the flag's white backdrop wherever the image doesn't reach. */
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
          background: radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.1) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
        @media (max-width: 640px) {
          .home-bg-container {
            background-image: var(--home-bg-overlay), url('/lebanon-flag-960.webp');
            background-image: var(--home-bg-overlay), image-set(url('/lebanon-flag-960.webp') 1x, url('/lebanon-flag-1920.webp') 2x);
            /* Sized to the width instead of "cover": covering a tall portrait screen upscaled the flag until it pixelated.
               42% / 1.5rem puts the cedar beside the hero logo, above the action cards. */
            background-size: 200% 200%, 200% auto;
            background-position: 0% 0%, 42% 1.5rem;
          }
        }
      `}</style>
      
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start md:justify-center w-full px-4 pb-8 md:pb-16 pt-6 sm:pt-8 md:pt-12 gap-6 sm:gap-8 md:gap-10">
        {/* Hero Section */}
        <HeroSection />

        {/* Action Buttons */}
        <ActionButtons />

        {/* View Map Button */}
        <ViewMapButton />
      </main>

      <div className="relative z-10 w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
}
