"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

export default function ResetPasswordForm() {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            setIsSubmitting(false)
            return
        }

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password: newPassword,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || "Something went wrong")
            }

            setIsSuccess(true)
            // Get user role from the response or token
            const role = result.role || '';
            // Redirect to login page with role parameter after 3 seconds
            setTimeout(() => {
                router.push(`/login?role=${role}`)
            }, 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen w-full bg-greenook flex items-center justify-center p-4 sm:p-6">
                <div className="absolute inset-0 bg-[url('/background/bg4.png')] bg-cover bg-center"></div>
                <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-2xl relative z-10">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Invalid Reset Link</h2>
                    <p className="text-gray-600 mb-6 text-center">This password reset link is invalid or has expired.</p>
                    <Link
                        href="/forgot-password"
                        className="w-full bg-custom-green hover:bg-custom-green text-white font-medium py-2.5 px-4 rounded-full flex items-center justify-center"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        )
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
                            <Image src="/logo2.png" alt="Trekking Miles Logo" fill className="object-contain" />
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
                        <h2 className="text-2xl sm:text-3xl font-normal text-gray-800 mb-3 sm:mb-4 text-center font-nunito">
                            Change your password
                        </h2>

                        {!isSuccess ? (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-bold text-gray-800 mb-1">
                                            New password*
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="new-password"
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                placeholder="Enter new password"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-bold text-gray-800 mb-1">
                                            Confirm password*
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirm-password"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                placeholder="Re-enter password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-custom-green hover:bg-custom-green text-white font-medium py-2.5 px-4 rounded-full flex items-center justify-center"
                                    >
                                        {isSubmitting ? "Processing..." : "Change Password"}
                                        {isSubmitting && (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="mb-4 text-emerald-600 flex justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-16 w-16"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">Password Changed!</h2>
                                <p className="mt-2 text-gray-600">Your password has been successfully updated.</p>
                                <p className="mt-4 text-sm text-gray-500">Redirecting to login page...</p>
                            </div>
                        )}

                        <div className="mt-4 text-center text-sm text-gray-700">
                            Want to go back?{" "}
                            <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 