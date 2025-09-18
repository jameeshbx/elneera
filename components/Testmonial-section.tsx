"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { testimonials } from "../data/testmonial";

export default function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="w-full bg-white py-8 md:py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
      id="testimonial"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          {/* Left side - Static dashboard image */}
          <div className="w-full lg:w-1/2 relative mb-8 lg:mb-0 rounded-xl overflow-hidden hidden lg:block h-[480px]">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[47px] mt-[-35px] ml-[15px] font-medium text-black leading-tight z-10 relative p-6 font-nunito">
              Hear from our
              <br />
              satisfied
              <br />
              clients
            </h2>

            {/* Static dashboard image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/img/Rectangle 7608.svg"
                alt="Dashboard interface"
                fill
                className="object-cover object-left"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Mobile heading - only visible on mobile */}
          <div className="lg:hidden mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-black leading-tight text-center font-nunito">
              Hear from our satisfied clients
            </h2>
          </div>

          {/* Right side - Changing testimonial card */}
          <div
            className="w-full lg:w-1/2 mx-auto relative"
            style={{ maxWidth: "500px" }}
          >
            <div className="bg-custom-lightorange rounded-xl p-5 sm:p-6 md:p-7 relative h-[480px] flex flex-col">
              {/* Arrow icon */}
              <div className="absolute top-5 right-5 bg-orange-500 rounded-full p-3 border-4 border-white">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 17L17 7M17 7H7M17 7V17"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Changing profile image */}
              <div className="flex justify-center mb-4 sm:mb-5">
                <div className="w-40 h-40 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white">
                  <Image
                    src={
                      testimonials[currentTestimonial].image ||
                      "/placeholder.svg"
                    }
                    alt="Client profile"
                    width={144} // Increased from 106
                    height={144} // Increased from 106
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Changing testimonial text with animation */}
              <div
                className="text-center mb-4 flex-grow flex flex-col justify-center transition-opacity duration-300"
                key={currentTestimonial}
              >
                {/* Increased text size here */}
                <p className="text-lg sm:text-xl md:text-2xl font-medium text-white mb-6 sm:mb-8 font-Poppins mt-6">
                  {testimonials[currentTestimonial].quote}
                </p>

                <div className="text-orange-500 text-4xl sm:text-5xl font-serif">
                  ,,
                </div>

                {/* Increased text size here */}
                <p className="text-lg sm:text-xl font-semibold text-white mt-3 font-Poppins">
                  {testimonials[currentTestimonial].company}
                </p>
              </div>
            </div>

            {/* Carousel indicators */}
            <div className="flex justify-center mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`mx-1 h-2 rounded-full transition-all ${
                    currentTestimonial === index
                      ? "bg-orange-500 w-5"
                      : "bg-orange-200 hover:bg-orange-300 w-2"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
