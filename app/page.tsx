import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ClientLogosSection } from "@/components/landing/ClientLogosSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#282828]">
      <Header />
      <HeroSection />
      <ClientLogosSection />
      <FeaturesSection />
      <TestimonialSection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}