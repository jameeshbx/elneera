"use client"
import Image from "next/image"
import { FeatureCard } from "./FeatureCard"

const features = [
  {
    title: "Connect with dmcs and tour operators compare prices, and finalize deals.",
    imageSrc: "/background/feature1.png?height=400&width=600",
    containerClassName: "xl:col-span-8  mx-auto shadow-xl",
  },
  {
    title: "DMC & Supplier Integration",
    imageSrc: "/background/gradient.png?height=400&width=600",
    isGradient: true,
    containerClassName: "xl:col-span-4  mx-auto",
  },
  {
    title: "Automated Notifications",
    imageSrc: "/background/gradient.png?height=400&width=600",
    isGradient: true,
    containerClassName: "xl:col-span-4  mx-auto",
  },
  {
    title: "Get real-time updates on itinerary status and payments.",
    imageSrc: "/background/feature2.png?height=400&width=600",
    containerClassName: "xl:col-span-8  mx-auto",
    isGradient: true,
  },
  {
    title: "Accept global payments with real-time exchange rates.",
    imageSrc: "/background/feature3.png?height=400&width=600",
    containerClassName: "xl:col-span-8  mx-auto",
    imageClassName: "lg:-mt-4 sm:-mt-7",
    isGradient: true,
  },
  {
    title: "International Tour Payments",
    imageSrc: "/background/gradient.png?height=400&width=600",
    isGradient: true,
    containerClassName: "xl:col-span-4  mx-auto",
  },
  {
    title: "Connected Inbox",
    imageSrc: "/background/gradient.png?height=400&width=600",
    isGradient: true,
    containerClassName: "xl:col-span-5  mx-auto",
  },
  {
    title: "Instantly get personalized itineraries based on your preferences, time, and budget.",
    imageSrc: "/background/feature4.png?height=400&width=600",
    containerClassName: "xl:col-span-7  mx-auto shadow-xl",
    imageClassName: "lg:w-w2 lg:-ml-5",
  },
];

export default function TravelFeatures() {
  return (
    <div className="w-full max-w-7xl mx-auto relative px-6 md:px-10 py-12 md:py-18 -mt-16">
      {/* Background dots pattern */}
      <div className="absolute left-0 top-0 w-64 h-64 opacity-80 m-12 ml-28 hidden md:block">
        <Image src="/background/dots.png" alt="Dots pattern" width={250} height={250} className="object-contain" />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Heading */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 font-nunito leading-9 tracking-normal">
            Smart Features for Effortless Travel
          </h1>
          <p className="text-gray-600 text-lg md:text-xl font-poppins font-medium tracking-normal">
            Plan, book, and manage with ease—all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-6 p-8 xl:p-32 -mt-8 xl:-mt-32">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              imageSrc={feature.imageSrc}
              isGradient={feature.isGradient}
              imageClassName={feature.imageClassName}
              containerClassName={feature.containerClassName}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

