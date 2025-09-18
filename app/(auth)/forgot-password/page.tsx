"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Mail, Lock, ChevronLeft } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong")
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-greenook flex items-center justify-center p-4 sm:p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/background/bg4.png')] bg-cover bg-center"></div>

      {/* Main container */}
      <div className="w-full max-w-5xl lg:h-h1 bg-transparent flex flex-col md:flex-row rounded-lg overflow-hidden shadow-2xl relative z-10">
        {/* Left side - Green background with branding */}
        <div className="w-full md:w-1/2 bg-secondary-green relative p-6 sm:p-8 md:p-12 flex flex-col justify-center min-h-[300px] sm:min-h-[350px] md:min-h-0">
          <div className="absolute inset-0 bg-[url('/background/bg5.png')] bg-repeat-round"></div>

          <div className="relative z-10 flex flex-col -mt-32 sm:-mt-38 md:-mt-48 lg:-mt-56 xl:-mt-72">
            {/* Responsive logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 relative -mb-2 sm:-mb-3 md:-mb-4 self-start">
              <Image src="/logo2.png" alt="Trekking Miles Logo" fill className="object-contain" data-cy="logo" />
            </div>

            <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium mb-2 sm:mb-3 md:mb-4 font-nunito">
              Start your remarkable journey with us!
            </h1>

            <p className="text-white/90 text-xs sm:text-sm font-nunito">Seamless Access to Your Travel Business Hub</p>
          </div>
        </div>

        {/* Right side - White background with form */}
        <div className="w-full md:w-1/2 bg-white p-6 sm:p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h2
              className="text-2xl sm:text-3xl font-normal text-gray-800 mb-3 sm:mb-4 text-center font-nunito"
              data-cy="reset-title"
            >
              Reset Your Password
            </h2>

            {!isSuccess ? (
              <>
                <p className="text-gray-600 mb-6 sm:mb-8 text-center text-sm sm:text-base font-nunito">
                  Forgot your password? No worries, then lets submit password reset. It will be send to your email.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} data-cy="reset-form">
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-1 font-raleway">
                      Email Address
                    </label>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 w-full rounded-full border border-gray-300 py-2.5 sm:py-3 px-4 text-gray-900 font-raleway placeholder-gray-500 focus:border-green-500 focus:ring-green-500 text-sm sm:text-base"
                        placeholder="your@email.com"
                        required
                        data-cy="email-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-custom-green hover:bg-custom-green  text-white font-raleway font-medium py-2.5 sm:py-3 px-4 rounded-full flex items-center justify-center transition-colors duration-200 text-sm sm:text-base"
                    data-cy="reset-button"
                  >
                    Reset Password
                    {isSubmitting ? (
                      <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    ) : (
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 ml-2 font-medium" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div
                className="bg-green-50 border border-green-200 rounded-md p-3 sm:p-4 mb-6 sm:mb-8 text-sm sm:text-base"
                data-cy="success-message"
              >
                <p className="text-green-800">
                  Password reset link has been sent to your email. Please check your inbox.
                </p>
              </div>
            )}

            <div className="mt-4 sm:mt-6 flex items-center justify-center">
              <Link
                href="/login"
                className="inline-flex items-center text-custom-green hover:text-secondary-green font-nunito font-semibold transition-colors duration-200 text-sm sm:text-base"
                data-cy="back-link"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 font-semibold" />
                Back to login screen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

