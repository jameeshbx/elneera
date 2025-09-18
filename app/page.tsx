import Navbar from "../components/TopBar";
import Herosection from "../components/Hero-section";
import Feature from "../components/Featured-section";
import SmartFeature from "../components/SmartFeature";
import HowItWorks from "../components/Working";
import SeeItInAction from "../components/WVideo";
// import Pricing from "../components/Pricing-section";
import ContactSection from "@/components/ContactSection";
import FAQSection from "@/components/Faq-section";
import TestimonialSection from "@/components/Testmonial-section";
import Footer from "@/components/Footer";


export default function Home() {
  return (
    <div>
      <Navbar />
      <Herosection />
      <Feature />
      <HowItWorks />
      <SeeItInAction />
      <SmartFeature />
      {/* Hide pricing section for now */}
      {/* <Pricing /> */}
      <FAQSection />
      <TestimonialSection />
      <div className="relative py-16">
        <ContactSection />
      </div>
      <Footer />
      
    </div>
  );
}
