"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { featuresData } from "../data/featured";

export default function FeaturesSection() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isTablet, setIsTablet] = useState<boolean | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === featuresData.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? featuresData.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isMobile]);

  if (isMobile === null || isTablet === null) {
    return (
      <section className="py-16 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-nunito mb-4">
              Our Value to You
            </h2>
            <p className="text-xl text-gray-600 font-Poppins max-w-3xl mx-auto">
              Empowering Travel bussiness with streamlined tools
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
            {featuresData.slice(0, 4).map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 bg-white z-[-1] " id="about">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-nunito mb-4">
            Our Value to You
          </h2>
          <p className="text-xl text-gray-600 font-poppins max-w-3xl mx-auto">
             Empowering Travel bussiness with streamlined tools
          </p>
        </div>

        {/* Mobile View */}
        {isMobile && (
          <div className="relative px-12">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {featuresData.map((feature, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="relative mx-auto max-w-[280px]">
                      <MobileFeatureCard {...feature} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-white/80 hover:bg-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-white/80 hover:bg-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4 text-black" />
            </Button>

            <div className="flex space-x-2 justify-center mt-6">
              {featuresData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    currentIndex === index ? "bg-emerald-800" : "bg-gray-300"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tablet View */}
        {isTablet && (
          <div className="relative px-8">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${
                    Math.floor(currentIndex / 2) * 100
                  }%)`,
                }}
              >
                {Array.from({ length: Math.ceil(featuresData.length / 2) }).map(
                  (_, groupIndex) => (
                    <div key={groupIndex} className="w-full flex-shrink-0">
                      <div className="flex gap-6 px-4">
                        {featuresData
                          .slice(groupIndex * 2, groupIndex * 2 + 2)
                          .map((feature, index) => (
                            <div key={index} className="w-1/2">
                              <FeatureCard {...feature} />
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-white/80 hover:bg-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-md bg-white/80 hover:bg-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4 text-black" />
            </Button>

            <div className="flex space-x-2 justify-center mt-6">
              {Array.from({ length: Math.ceil(featuresData.length / 2) }).map(
                (_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index * 2)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      Math.floor(currentIndex / 2) === index
                        ? "bg-emerald-800"
                        : "bg-gray-300"
                    )}
                    aria-label={`Go to slide group ${index + 1}`}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* Desktop View */}
        {!isMobile && !isTablet && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              {featuresData.slice(0, 4).map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {featuresData.slice(4, 7).map((feature, index) => (
                <FeatureCard key={index + 4} {...feature} />
              ))}
              {featuresData[7] && (
                <FeatureCard
                  key={7}
                  {...featuresData[7]}
                  isSeventhCard={true}
                />
              )}
            </div>

            {/* Additional Image Section - Only on desktop */}
            <div className="mb-20 flex justify-end absolute right-32 bottom-[-800px] z-0">
              <Image
                src="/img/Kit 6.svg"
                alt="Additional Section"
                width={200}
                height={200}
                className="rounded-lg shadow-lg object-cover"
                sizes="(max-width: 768px) 100vw, 200px"
                priority
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MobileFeatureCard({
  imagePath,
  title,
  description,
}: {
  imagePath: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all hover:shadow-md h-full flex flex-col items-center text-center">
      <div className="mb-6 relative w-20 h-20">
        <Image
          src={imagePath || "/placeholder.svg"}
          alt={title}
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function FeatureCard({
  imagePath,
  title,
  description,
  isSeventhCard = false,
}: {
  imagePath: string;
  title: string;
  description: string;
  isSeventhCard?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 transition-all hover:shadow-md h-full z-10">
      {isSeventhCard ? (
        <div className="flex gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
              {title}
            </h3>
            <p className="text-gray-600">{description}</p>
          </div>
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={imagePath || "/placeholder.svg"}
              alt={title}
              fill
              className="object-cover rounded-lg"
              sizes="80px"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 relative w-12 h-12">
            <Image
              src={imagePath || "/placeholder.svg"}
              alt={title}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
            {title}
          </h3>
          <p className="text-gray-600">{description}</p>
        </>
      )}
    </div>
  );
}
