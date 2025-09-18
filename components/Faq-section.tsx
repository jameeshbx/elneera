"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import Image from "next/image"
import { faqItems } from "../data/faq"

export default function FAQSection() {
  const [openQuestion, setOpenQuestion] = useState<number>(0)

  const toggleQuestion = (index: number) => {
    setOpenQuestion(openQuestion === index ? -1 : index)
  }

  return (
    <div className="relative w-full overflow-hidden bg-white py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20 mt-10">
      {/* Background pattern */}
      <div className="hidden md:block absoloute inset-0 -z-10 ">
        <Image src="/img/Element.svg" alt="" fill className="object-cover opacity-100" priority />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 font-nunito">
            Got Questions? We&apos;ve Got Answers
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-2 sm:px-0 font-Poppins">
            Find everything you need to know about planning, booking, and managing travel effortlessly
          </p>
        </div>

        {/* FAQ and right side content container */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 max-w-7xl mx-auto font-Poppins">
          {/* FAQ accordion - full width on mobile, 2/3 on lg+ */}
          <div className="w-full lg:w-2/3 space-y-3 sm:space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  className="w-full flex justify-between items-center p-4 sm:p-6 text-left font-Poppins cursor-pointer"
                  onClick={() => toggleQuestion(index)}
                >
                  <span className="font-medium text-base sm:text-lg">{item.question}</span>
                  {openQuestion === index ? (
                    <Minus className="h-5 w-5 sm:h-6 sm:w-6 text-black font-bold cursor-pointer" />
                  ) : (
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-black font-bold cursor-pointer" />
                  )}
                </button>
                {openQuestion === index && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <p className="text-gray-700 text-sm sm:text-base">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right side content - hidden on mobile, shown from lg breakpoint */}
          <div className="hidden lg:block w-full lg:w-1/3">
            <div className="relative h-full">
              {/* Envelope icon positioned at the top */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
                <Image
                  src="/img/Group 1000003061.svg"
                  alt="Envelope icon"
                  width={380}
                  height={90}
                  className="w-[300px] h-auto"
                />
              </div>

              {/* Content box - matches height of FAQ section */}
              <div className="bg-white p-6 pt-16 rounded-lg border border-gray-200 text-center h-[450px] flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2 font-Poppins">Do you have more questions?</h2>
                  <p className="text-gray-700 font-Poppins">
                    Access Your Dashboard and Manage
                    <br />
                    Seamless Travel Experiences
                  </p>
                </div>
                <div>
                  <button className="bg-[#183F30] text-white py-3 px-6 rounded-full hover:bg-opacity-90 transition-all cursor-pointer mt-10">
                    Shoot a Direct Mail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only alternative for the right side content */}
        <div className="lg:hidden mt-8 bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/img/Group 1000003061.svg"
              alt="Envelope icon"
              width={200}
              height={50}
              className="w-[150px] h-auto"
            />
          </div>
          <h2 className="text-xl font-bold mb-2">Do you have more questions?</h2>
          <p className="text-gray-700 mb-6">Access Your Dashboard and Manage Seamless Travel Experiences</p>
          <button className="bg-[#183F30] text-white py-3 px-6 rounded-full hover:bg-opacity-90 transition-all cursor-pointer w-full sm:w-auto">
            Shoot a Direct Mail
          </button>
        </div>
      </div>
    </div>
  )
}

