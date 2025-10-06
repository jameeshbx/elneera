"use client"

import Image from "next/image"
import Link from "next/link"
import { Eye, X, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { toast } from "sonner"


const userTypes = ["USER", "AGENCY_ADMIN", "TEAM_LEAD", "ADMIN", "SUPER_ADMIN"] as const

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  userType: z.enum(["USER", "AGENCY_ADMIN", "TEAM_LEAD", "ADMIN", "SUPER_ADMIN"], {
    message: "Please select a valid user type"
  })
});

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupForm() {
  const [isMobile, setIsMobile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      companyName: formData.get("companyName") as string,
      userType: formData.get("userType") as SignupFormData["userType"],
      
    }

    try {
      const validatedData = signupSchema.parse(data)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Something went wrong")
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to create account");
      }

      toast.success("Account created successfully! Please login to continue.");
      
      // Redirect to login page after successful signup
      router.push('/login');
      return;
    } catch (error) {
      if (error && typeof error === 'object') {
        if ('issues' in error && Array.isArray(error.issues) && error.issues[0]?.message) {
          // Handle Zod error
          toast.error(error.issues[0].message);
        } else if ('message' in error && typeof error.message === 'string') {
          // Handle standard Error
          toast.error(error.message);
        } else {
          // Fallback for unknown errors
          toast.error("Something went wrong");
        }
      } else {
        toast.error("An unknown error occurred");
      }
    }finally {
      setIsLoading(false)
    }
  }

  
  return (
    <div className="relative w-full overflow-hidden py-6 px-4 sm:px-6 lg:px-8 bg-custom-green z-[10]">
      <div className="absolute inset-0 -z-[10]">
        <Image
          src="/login/Group 1171275929.svg"
          alt=""
          fill
          className="object-cover opacity-100"
          priority
        />
      </div>

      {!isMobile && (
        <Link
          href="/"
          className="absolute top-5 left-5 bg-custom-green rounded-full p-2 border-2 border-white z-50 cursor-pointer hover:bg-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white rotate-[-320deg]" />
        </Link>
      )}

      {isMobile && (
        <Link
          href="/"
          className="absolute top-5 right-5 bg-custom-green rounded-full p-2 border-2 border-white z-50 cursor-pointer hover:bg-custom-green transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </Link>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-8">
        {!isMobile ? (
          <div className="mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-lg shadow-lg md:flex-row">
            <div className="relative w-full bg-greenook p-8 md:p-10 md:w-1/2">
              <div className="absolute -left-8 -bottom-6 z-0">
                <Image
                  src="/login/Group 1171275832.svg"
                  alt="Decorative dot pattern"
                  width={200}
                  height={200}
                  className="opacity-80"
                />
              </div>
              <div className="absolute -right-10 -top-2 z-0">
                <Image
                  src="/login/Group 1171275833.svg"
                  alt="Decorative dot pattern"
                  width={100}
                  height={100}
                  className="opacity-80"
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center md:justify-start">
                <Image
  src="/logo/elneeraw.png"
  alt="Trekking Miles Logo"
  width={50}
  height={20}
  className="object-contain mt-[56px] w-[137px] ml-[126px]"
/>
                                 </div>
                

                <h1 className="mt-8 md:mt-12 lg-mt-[-30] text-3xl font-nunito md:text-4xl font-semibold text-white text-center md:text-left">
                  Join Elneera Today!
                </h1>

                <p className="mt-4 md:mt-6 text-base md:text-lg text-white/90 text-center md:text-left text-sans font-normal">
                  Create your account and start your journey
                </p>
              </div>
            </div>

            <div className="relative w-full bg-white p-6 md:p-8 lg:p-12 md:w-1/2 z-30">
              <div className="mx-auto max-w-md">
                <h2 className="mb-6 md:mb-8 md:text-lg lg:text-4xl font-nunito font-bold text-gray-900 text-center">
                  Create Account <span className="inline-block">🚀</span>
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Full Name*
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email*
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700">
                      Company Name*
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="Enter your company name"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="userType" className="block text-sm font-semibold text-gray-700">
                      User Type*
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      required
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="">Select user type</option>
                      {userTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password*
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        required
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label="Toggle password visibility"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-greenook px-4 py-3 font-medium text-white hover:bg-greenook focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>

                  <div className="text-center text-sm text-gray-700">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-greenook hover:text-greenook">
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // Mobile layout
          <div className="w-full max-w-md">
            <div className="bg-greenook p-6 rounded-t-lg relative overflow-hidden z-20">
              <div className="relative z-30">
                <div className="flex justify-center mb-4">
                  <Image
                    src="/login/cropped-logo-1_1567c4bc-84c5-4188-81e0-d5dd9ed8ef8d (1) 1.svg"
                    alt="Elneera Logo"
                    width={180}
                    height={60}
                    className="object-contain"
                    priority
                  />
                </div>

                <h1 className="text-xl font-semibold text-white text-center font-nunito">
                  Join Elneera Today!
                </h1>

                <p className="mt-2 text-sm text-white/90 text-center font-normal font-poppins">
                  Create your account and start your journey
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-b-lg z-30">
              <h2 className="mb-4 text-xl font-bold text-center lg:text-4xl font-nunito">
                Create Account <span className="inline-block">🚀</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name-mobile" className="block text-sm text-gray-700 mb-1 font-semibold">
                    Full Name*
                  </label>
                  <input
                    id="name-mobile"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="email-mobile" className="block text-sm text-gray-700 mb-1 font-semibold">
                    Email*
                  </label>
                  <input
                    id="email-mobile"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="companyName-mobile" className="block text-sm text-gray-700 mb-1 font-semibold">
                    Company Name*
                  </label>
                  <input
                    id="companyName-mobile"
                    name="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="userType-mobile" className="block text-sm text-gray-700 mb-1 font-semibold">
                    User Type*
                  </label>
                  <select
                    id="userType-mobile"
                    name="userType"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">Select user type</option>
                    {userTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="password-mobile" className="block text-sm text-gray-700 mb-1 font-semibold">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      id="password-mobile"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label="Toggle password visibility"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-full bg-greenook px-4 py-2 font-medium text-white hover:bg-greenook focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>

                <div className="text-center text-sm text-gray-700 mt-4">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-greenook hover:text-greenook">
                    Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}