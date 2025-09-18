"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [showPopup, setShowPopup] = useState(false);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <section
      className="w-full bg-white relative min-h-[70vh] md:min-h-screen"
      id="home"
    >
      {/* Popup Modal - Same style as ContactSection */}
       {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-auto">
          <div 
            className="relative bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
          >
            <button 
              onClick={closePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#1a4738] mb-3">Coming Soon!</h3>
              <p className="text-gray-600 mb-6">Thank you for your interest! To learn more, please reach out to our Product Team at 9746904081.</p>
              
              <button 
                onClick={closePopup}
                className="bg-[#1a4738] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1a4738]/90 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
          
          {/* Click outside to close - subtle overlay */}
          <div 
            className="absolute inset-0 bg-black/5 backdrop-blur-sm -z-10"
            onClick={closePopup}
          />
        </div>
      )}

      <div className="absolute inset-0 w-full h-full hidden md:block">
        <div className="relative w-full h-full lg:top-[120px] md:top-[60px] md:h-[calc(100%+150px)]">
          <Image
            src="/background/Group 1171275925.png"
            alt="Background pattern"
            fill
            className="object-cover object-center md:object-top"
            priority
          />
        </div>
      </div>

      <div className="container relative z-10 px-4 pt-8 sm:pt-[58px] md:pt-[88px] mx-auto h-full">
        <div className="flex flex-col lg:flex-row items-center h-full">
          <div className="w-full lg:w-1/2 mb-6 sm:mb-8 lg:mb-0 lg:ml-[-10px] lg:mt-[-30px] md:mb-12">
            <div className="max-w-xl mx-auto lg:ml-40 md:ml-0 lg:mx-0 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl font-Raleway leading-tight tracking-tight md:text-5xl lg:text-6xl text-[#0F3D2E] m-[revert] sm:mt-[65px] md:mt-[40px]">
                Your Travel <br className="hidden md:block" /> Business&apos;s{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 font-Beiruti text-orange">
                    A
                  </span>
                  <span className="relative z-10 font-Raleway">
                    ll-
                    <span className="relative z-10 font-Beiruti text-orange">
                      I
                    </span>
                    n-One
                  </span>
                  <Image
                    src="/img/Vector (3).svg"
                    alt="All-in-One decoration"
                    width={600}
                    height={50}
                    className="absolute bottom-[0px] left-[-7%] w-[122%] max-w-[114%] z-0 "
                  />
                </span>
                <br className="hidden md:block" /> Solution
              </h1>

              <p className="mt-4 sm:mt-[30px] text-lg sm:text-xl text-gray-600 max-w-lg mx-auto md:mx-0 font-Poppins lg:-mt-8 md:mt-6">
                Notice the
                <span className="text-orange font-Beiruti"> AI</span>?
                That&apos;s what makes it smart.
              </p>

              <p className="mt-4 sm:mt-[30px] text-lg sm:text-xl text-gray-600 max-w-lg mx-auto md:mx-0 font-Poppins lg:mt-8 md:mt-6">
                Smart Tools for Smarter Agencies — Manage Itineraries, Bookings,
                and DMC Communications with Ease.
              </p>

              <div className="mt-4 sm:mt-[30px] md:mt-[30px]">
                <Button
                  onClick={handleButtonClick}
                  size="lg"
                  className="font-medium rounded-full font-Poppins w-full md:w-auto 
                             sm:px-6 sm:py-3 md:px-8 md:py-5 lg:px-8 lg:py-8 
                             text-base sm:text-lg md:text-lg 
                             bg-orange hover:bg-orange text-white 
                             transition-all duration-300"
                >
                  Start 14 Days Trial
                </Button>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end mt-8 sm:mt-[58px] md:mt-0 lg:mt-0">
            <div className="relative w-full max-w-[500px] md:max-w-[600px] lg:max-w-2xl md:top-[30px] lg:top-[120px]">
              <Image
                src="/img/Pixel True Mockup 3.svg"
                alt="Travel agency dashboard"
                width={700}
                height={500}
                className="object-contain w-full h-auto md:scale-110 lg:scale-100 scale-[1.2] sm:scale-[1.5]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
