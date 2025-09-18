"use client"

import Image from "next/image"
import { ArrowUpRight, X } from "lucide-react"
import { useState } from "react"

export default function ContactSection() {
  const [showPopup, setShowPopup] = useState(false)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
  }

  return (
    <section className="relative w-full py-8 -mb-28">
      {/* Popup Modal - No dark overlay */}
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

      <div className="relative w-full bg-white py-16 px-4 sm:px-6 lg:px-8">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10 h-full">
          <Image
            src="/background/bg2.png"
            alt=""
            fill
            className="object-cover mt-52"
            priority
          />
        </div>

        {/* Wavy lines element in the top right corner */}
        <div className="absolute top-[-50px] right-0 w-full max-w-52 pointer-events-none">
          <Image src="/background/dots2.png" alt="" width={200} height={200} className="object-contain" />
        </div>

        {/* Main green card */}
        <div className="relative mx-auto max-w-7xl rounded-2xl bg-[#1a4738] overflow-hidden">
          <div className="absolute inset-0">
            <Image src="/background/bg3.png" alt="" layout="fill" objectFit="cover" className="opacity-50" />
          </div>
          <div className="container mx-auto px-6 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between relative z-10">
            <div className="mb-8 md:mb-0 md:max-w-md">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-4 font-nunito leading-10">
                Ready to supercharge your agency?
              </h2>
              <p className="text-white/90 text-lg font-poppins">Let&apos;s create, edit & share travel plans in minutes.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleButtonClick}
                className="bg-white text-custom-green px-6 py-10 rounded-lg font-medium flex items-center justify-between min-w-52 hover:bg-white/90 transition-colors"
              >
                <span className="-mb-11 font-bold">Try for free</span>
                <ArrowUpRight className="h-5 w-5 -mb-11" />
              </button>
              <button
                onClick={handleButtonClick}
                className="border border-orange text-orange px-6 py-10 rounded-lg font-medium flex items-center justify-between min-w-52 hover:bg-orange/10 transition-colors"
              >
                <span className="-mb-11 font-bold">Contact Us</span>
                <ArrowUpRight className="h-5 w-5 -mb-11" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}