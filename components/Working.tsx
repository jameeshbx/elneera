"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = 5

  // Handle step navigation
  const nextStep = () => {
    setCurrentStep((prev) => (prev === totalSteps - 1 ? 0 : prev + 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => (prev === 0 ? totalSteps - 1 : prev - 1))
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    const steps = sectionRef.current?.querySelectorAll(".step-item")
    steps?.forEach((step) => {
      observer.observe(step)
    })

    return () => {
      steps?.forEach((step) => {
        observer.unobserve(step)
      })
    }
  }, [])

  // Array of step data for easier rendering
  const stepsData = [
    {
      number: "01",
      color: "golden-yellow",
      title: "Sign Up & Get Approved",
      description:
        "Register your agency on this platform and submit the required documents to get approved, receive your login credentials via email.",
    },
    {
      number: "02",
      color: "orange-red",
      title: "Customize Your Agency Page",
      description:
        "Add your logo, brand colors, and key information to create a personalized agency page. Provide a seamless, branded experience for your customers.",
    },
    {
      number: "03",
      color: "light-blue",
      title: "Manage Itinerary Requests",
      description:
        "Receive inquiries from customers via WhatsApp or email, and use the built-in itinerary builder to create tailored travel plans.",
    },
    {
      number: "04",
      color: "dark-pink",
      title: "Connect with DMCs for Pricing",
      description:
        "Submit the finalized itinerary to selected DMCs for pricing, compare options, view margins, and share with your customers.",
    },
    {
      number: "05",
      color: "light-green",
      title: "Confirm & Track Bookings",
      description:
        "Upon customer approval, notify the DMC to proceed with bookings, track booking status, and manage payments using the travel module.",
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="relative py-16 px-4 overflow-hidden"
      id="how-it-works"
      data-testid="how-it-works-section"
    >
      <div className="absolute inset-0 -z-10">
        <Image src="/background/bg1.png" alt="" fill className="object-cover" priority />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-Nunito">How this Works</h2>
          <p className="text-lg text-gray-500 font-Poppins font-medium tracking-normal">
            Create, Customize, Confirm – Itineraries in Just 3 Steps!
          </p>
        </div>

        {/* Mobile Steps Slider */}
        <div className="md:hidden relative">
          {/* Left Navigation Button */}
          <button
            onClick={prevStep}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md border border-gray-200"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Right Navigation Button */}
          <button
            onClick={nextStep}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md border border-gray-200"
            aria-label="Next step"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <div className="overflow-hidden">
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              <div className="flex">
                {stepsData.map((step, index) => (
                  <div
                    key={index}
                    className="step-item flex flex-col items-center min-w-full px-4"
                    data-testid={`step-${index + 1}`}
                    style={{ opacity: index === currentStep ? 1 : 0 }}
                  >
                    <div className="relative">
                      {/* Outer thin circle */}
                      <div
                        className={`w-36 h-36 rounded-full border-2 border-${step.color} flex items-center justify-center`}
                      >
                        {/* Inner thick circle */}
                        <div
                          className={`w-32 h-32 rounded-full border-19 border-${step.color} flex items-center justify-center`}
                        >
                          {/* White center */}
                          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <div className="text-center">
                              <div className="font-bold text-2xl font-Urbanist">{step.number}</div>
                              <div className="text-xs uppercase font-Urbanist">STEP</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Left dot */}
                      <div
                        className={`absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-${step.color} rounded-full -ml-1`}
                      ></div>
                      {/* Right dot */}
                      <div
                        className={`absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-${step.color} rounded-full -mr-1`}
                      ></div>
                    </div>

                    <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
                      {step.title.includes(" ") ? step.title.split(" ").join(" ") : step.title}
                    </h3>
                    <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View - First Row (3 steps) */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Step 1 */}
          <div className="step-item flex flex-col items-center" data-testid="step-1">
            <div className="relative">
              {/* Outer thin circle */}
              <div className="w-36 h-36 rounded-full border-2 border-golden-yellow flex items-center justify-center">
                {/* Inner thick circle */}
                <div className="w-32 h-32 rounded-full border-19 border-golden-yellow flex items-center justify-center">
                  {/* White center */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="font-bold text-2xl font-Urbanist">01</div>
                      <div className="text-xs uppercase font-Urbanist">STEP</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left dot */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-golden-yellow rounded-full -ml-1"></div>
              {/* Right dot */}
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-golden-yellow rounded-full -mr-1"></div>
            </div>

            <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
              Sign Up & Get <br /> Approved
            </h3>
            <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
              Register your agency on this platform and submit the required documents to get approved, receive your
              login credentials via email.
            </p>
          </div>

          {/* Step 2 */}
          <div className="step-item flex flex-col items-center" data-testid="step-2">
            <div className="relative">
              {/* Outer thin circle */}
              <div className="w-36 h-36 rounded-full border-2 border-orange-red flex items-center justify-center">
                {/* Inner thick circle */}
                <div className="w-32 h-32 rounded-full border-19 border-orange-red flex items-center justify-center">
                  {/* White center */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="font-bold text-2xl font-Urbanist">02</div>
                      <div className="text-xs uppercase font-Urbanist">STEP</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left dot */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-red rounded-full -ml-1"></div>
              {/* Right dot */}
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-red rounded-full -mr-1"></div>
            </div>

            <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
              Customize Your <br />
              Agency Page
            </h3>
            <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
              Add your logo, brand colors, and key information to create a personalized agency page. Provide a seamless,
              branded experience for your customers.
            </p>
          </div>

          {/* Step 3 */}
          <div className="step-item flex flex-col items-center" data-testid="step-3">
            <div className="relative">
              {/* Outer thin circle */}
              <div className="w-36 h-36 rounded-full border-2 border-light-blue flex items-center justify-center">
                {/* Inner thick circle */}
                <div className="w-32 h-32 rounded-full border-19 border-light-blue flex items-center justify-center">
                  {/* White center */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="font-bold text-2xl font-Urbanist">03</div>
                      <div className="text-xs uppercase font-Urbanist">STEP</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left dot */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-light-blue rounded-full -ml-1"></div>
              {/* Right dot */}
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-light-blue rounded-full -mr-1"></div>
            </div>

            <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
              Manage Itinerary <br /> Requests
            </h3>
            <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
              Receive inquiries from customers via WhatsApp or email, and use the built-in itinerary builder to create
              tailored travel plans.
            </p>
          </div>
        </div>

        {/* Desktop View - Second Row (2 steps) */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 md:gap-12 mt-8 md:mt-12 md:px-20">
          {/* Step 4 */}
          <div className="step-item flex flex-col items-center" data-testid="step-4">
            <div className="relative">
              {/* Outer thin circle */}
              <div className="w-36 h-36 rounded-full border-2 border-dark-pink flex items-center justify-center">
                {/* Inner thick circle */}
                <div className="w-32 h-32 rounded-full border-19 border-dark-pink flex items-center justify-center">
                  {/* White center */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="font-bold text-2xl font-Urbanist">04</div>
                      <div className="text-xs uppercase font-Urbanist">STEP</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left dot */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-dark-pink rounded-full -ml-1"></div>
              {/* Right dot */}
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-dark-pink rounded-full -mr-1"></div>
            </div>

            <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
              Connect with DMCs/TOs <br /> for Pricing
            </h3>
            <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
              Submit your finalized itinerary to selected DMCs and TOs for pricing, compare options, view margins, and share with customers.
            </p>
          </div>

          {/* Step 5 */}
          <div className="step-item flex flex-col items-center" data-testid="step-5">
            <div className="relative">
              {/* Outer thin circle */}
              <div className="w-36 h-36 rounded-full border-2 border-light-green flex items-center justify-center">
                {/* Inner thick circle */}
                <div className="w-32 h-32 rounded-full border-19 border-light-green flex items-center justify-center">
                  {/* White center */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="text-center">
                      <div className="font-bold text-2xl font-Urbanist">05</div>
                      <div className="text-xs uppercase font-Urbanist">STEP</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Left dot */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-light-green rounded-full -ml-1"></div>
              {/* Right dot */}
              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-light-green rounded-full -mr-1"></div>
            </div>

            <h3 className="text-xl font-medium mt-4 text-golden-yellow text-center font-Poppins">
              Confirm & Track <br /> Bookings
            </h3>
            <p className="text-base text-center mt-2 text-gray-500 max-w-xs leading-6 font-Poppins">
            Upon customer approval, notify the DMC to proceed with bookings. Stay updated on booking status and manage payments using the forex module.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

