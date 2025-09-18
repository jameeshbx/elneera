"use client";

import { useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { pricingData, pricingHeader, buttonText } from "../data/price";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Handle billing cycle toggle
  //const toggleBillingCycle = () => {
  //setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
  //}

  // Handle create account button click
  const handleCreateAccount = (plan: string) => {
    console.log(
      `Creating account for ${plan} plan with ${billingCycle} billing`
    );
    window.location.href = `/`;
  };

  // Handle free trial button click
  const handleStartFreeTrial = (plan: string) => {
    console.log(`Starting free trial for ${plan} plan`);
    window.location.href = `/`;
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-white py-16 px-4 sm:px-6 lg:px-8"
      id="pricing"
    >
      {/* Background pattern */}
      <div className="absoloute inset-0 -z-10 ">
        <Image
          src="/img/Group 1171275893.jpg"
          alt=""
          fill
          className="object-cover opacity-100"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl  md:text-4xl lg:text-5xl font-bold mb-4 font-nunito">
            {pricingHeader.title}
          </h2>
          <p className="text-gray-600 text-lg lg:text-xl font-poppins">
            {pricingHeader.subtitle}
          </p>
        </div>

        {/* Pricing toggle */}
        <div className="flex items-center justify-center mb-12 font-bold">
          <span
            className={cn(
              "mr-3 text-base font-bold cursor-pointer", // Added font-bold
              billingCycle === "monthly"
                ? "text-gray-900"
                : "text-gray-500 font-poppins"
            )}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </span>

          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none cursor-pointer font-poppins"
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out font-poppins",
                billingCycle === "yearly" ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "ml-3 text-base font-medium cursor-pointer",
              billingCycle === "yearly"
                ? "text-gray-900"
                : "text-gray-500 font-poppins"
            )}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly
          </span>
          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 font-poppins">
            35% OFF
          </span>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Enterprise Plan */}
          <div className="bg-greenish rounded-lg overflow-hidden shadow-2xl flex flex-col border-0 hover:shadow-[0_20px_50px_rgba(13,106,58,0.4)] transition-shadow duration-300">
            <div className="p-6 h-[290px]">
              <h3 className="text-2xl font-bold text-white mb-1 font-poppins">
                {pricingData.enterprise.title}
              </h3>
              <p className="text-green-100 text-xl mb-6 font-poppins">
                {pricingData.enterprise.description}
              </p>

              <div className="mb-6">
                <span className="text-white text-4xl font-bold font-poppins">
                  $
                  {billingCycle === "monthly"
                    ? pricingData.enterprise.monthly
                    : Math.round(pricingData.enterprise.yearly / 12)}
                </span>
                <span className="text-green-100 text-sm ml-1 font-poppins">
                  per seat /month
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full bg-white !text-green-800 hover:bg-white !text-green-800 border-0 font-semibold text-base rounded-lg mt-5 h-[66px] cursor-pointer font-poppins"
                onClick={() => handleCreateAccount("enterprise")}
              >
                {buttonText.createAccount}
              </Button>
            </div>

            <div className="bg-greenish p-6 flex-grow flex flex-col font-poppins">
              <ul className="space-y-3 mb-auto">
                {pricingData.enterprise.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-300 mr-2 mt-0.5 flex-shrink-0 font-poppins" />
                    <span className="text-green-100 font-poppins">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-0">
              <Button
                className="w-full rounded-none bg-custom-green hover:bg-darkgreenish text-white h-[86px] text-lg font-semibold border-0 cursor-pointer font-poppins"
                onClick={() => handleStartFreeTrial("enterprise")}
              >
                {buttonText.startTrial}
              </Button>
            </div>
          </div>

          {/* Basic Plan */}
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col border-0 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="p-6 h-[290px]">
              <h3 className="text-2xl font-bold text-gray-900 mb-1 font-poppins">
                {pricingData.basic.title}
              </h3>
              <p className="text-gray-500 text-xl mb-6 font-poppins">
                {pricingData.basic.description}
              </p>

              <div className="mb-6">
                <span className="text-gray-900 text-4xl font-bold font-poppins">
                  $
                  {billingCycle === "monthly"
                    ? pricingData.basic.monthly
                    : Math.round(pricingData.basic.yearly / 12)}
                </span>
                <span className="text-gray-500 text-sm ml-1 font-poppins">
                  per seat /month
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full bg-custom-green !text-white hover:bg-custom-green !text-white border-0 h-[66px] text-base rounded-lg mt-5 cursor-pointer font-semibold font-poppins"
                onClick={() => handleCreateAccount("basic")}
              >
                {buttonText.createAccount}
              </Button>
            </div>

            <div className="bg-white p-6 flex-grow flex flex-col font-poppins">
              <ul className="space-y-3 mb-auto">
                {pricingData.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0 font-poppins" />
                    <span className="text-gray-700 font-poppins">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-0">
              <Button
                className="w-full rounded-none bg-[#F2F2F2] hover:bg-[#F2F2F2] text-gray-800 h-[86px] text-lg font-semibold border-0 cursor-pointer font-poppins"
                onClick={() => handleStartFreeTrial("basic")}
              >
                {buttonText.startTrial}
              </Button>
            </div>
          </div>

          {/* Business Pack */}
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col border-0 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="p-6 h-[290px]">
              <h3 className="text-2xl font-bold text-gray-900 mb-1 font-poppins">
                {pricingData.business.title}
              </h3>
              <p className="text-gray-500 text-xl mb-6 font-poppins">
                {pricingData.business.description}
              </p>

              <div className="mb-6">
                <span className="text-gray-900 text-4xl font-bold font-poppins">
                  $
                  {billingCycle === "monthly"
                    ? pricingData.business.monthly
                    : Math.round(pricingData.business.yearly / 12)}
                </span>
                <span className="text-gray-500 text-sm ml-1 font-poppins">
                  per seat /month
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full bg-custom-green !text-white hover:bg-custom-green !text-white border-0 h-[66px] text-base rounded-lg mt-5 cursor-pointer font-semibold font-poppins"
                onClick={() => handleCreateAccount("business")}
              >
                {buttonText.createAccount}
              </Button>
            </div>

            <div className="bg-white p-6 flex-grow flex flex-col font-poppins">
              <ul className="space-y-3 mb-auto">
                {pricingData.business.features.map((feature, index) => (
                  <li key={index} className="flex items-start font-poppins">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0 " />
                    <span className="text-gray-700 font-poppins">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-0">
              <Button
                className="w-full rounded-none bg-custom-lightwhite hover:bg-custom-lightwhite text-gray-800 h-[86px] text-lg font-semibold border-0 cursor-pointer font-poppins"
                onClick={() => handleStartFreeTrial("business")}
              >
                {buttonText.startTrial}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
