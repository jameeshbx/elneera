"use client"
import { PlusCircle } from "lucide-react"
import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Eye, Facebook, Twitter, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { AgencyBankDetailsModal } from "./add-bank-details"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Camera } from "lucide-react"

interface ProfileData {
  name: string
  email: string
  fullName: string
  mobile: string
  location: string
  avatarUrl: string | null
}

interface AccountData {
  username: string
  password: string
  role: string
  location: string
  status: string
  lastLoggedIn: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  lastLoggedIn: string
  avatarColor: string
}

interface CommentData {
  id: string
  author: string
  authorAvatar: string | null
  content: string
  timestamp: string
}

interface CompanyInformation {
  name: string
  gstRegistration: string
  gstNo: string
  ownerName: string
  mobile: string
  email: string
  website: string
  logo: string | null
  country: string
  yearOfRegistration: string
  panNo: string
  panType: string
  headquarters: string
  yearsOfOperation: string
  landingPageColor: string
  businessLicense?: string | null
}

interface ApiResponse {
  profileData: ProfileData
  accountData: AccountData
  teamMembers?: TeamMember[]
  commentData?: CommentData | null
  companyInformation?: CompanyInformation
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [showComments, setShowComments] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [color, setColor] = useState("#0F9D58")
  const [, setTempColor] = useState("#0F9D58") // Added tempColor state
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Clear previous messages
    setUploadError(null)
    setUploadSuccess(null)

    // Validate file type and size
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validImageTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPEG, PNG, GIF, WEBP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setUploadError("Image size must be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("profileImage", file)

      const response = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      // Update the profile data with the new image URL
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: data.imageUrl,
      }))

      setUploadSuccess("Profile image updated successfully!")

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(null), 3000)
    } catch (error) {
      console.error("Error uploading profile image:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      // Clear the file input
      event.target.value = ""
    }
  }

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    fullName: "",
    mobile: "",
    location: "",
    avatarUrl: null,
  })

  const [accountData, setAccountData] = useState<AccountData>({
    username: "",
    password: "********",
    role: "",
    location: "",
    status: "",
    lastLoggedIn: "",
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [commentData, setCommentData] = useState<CommentData | null>(null)
  const [companyInformation, setCompanyInformation] = useState<CompanyInformation>({
    name: "",
    gstRegistration: "",
    gstNo: "",
    ownerName: "",
    mobile: "",
    email: "",
    website: "",
    logo: null,
    country: "",
    yearOfRegistration: "",
    panNo: "",
    panType: "",
    headquarters: "",
    yearsOfOperation: "",
    landingPageColor: "#0F9D58",
    businessLicense: null,
  })

  const handlePostComment = () => {
    console.log("Posted comment:", commentText)
    setCommentText("")
  }

  // Add this useEffect to track the modal state
  useEffect(() => {
    console.log("Bank Details Modal State:", showBankDetailsModal)
  }, [showBankDetailsModal])

  useEffect(() => {
    let cancelled = false

    const fetchProfileData = async () => {
      try {
        setError(null)
        setIsLoading(true)

        const response = await fetch("/api/auth/agency-profile-admin", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API Error Response:", errorData)
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data: ApiResponse = await response.json()
        if (cancelled) return

        console.log("Fetched data:", data)

        if (data.profileData) {
          setProfileData(data.profileData)
        }

        if (data.accountData) {
          setAccountData(data.accountData)
        }

        if (data.teamMembers) setTeamMembers(data.teamMembers)
        if (typeof data.commentData !== "undefined") setCommentData(data.commentData ?? null)
        if (data.companyInformation) {
          setCompanyInformation(data.companyInformation)
          setColor(data.companyInformation.landingPageColor || "#0F9D58")
          setTempColor(data.companyInformation.landingPageColor || "#0F9D58")
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch profile data")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (status === "loading") {
      return
    }

    if (status === "unauthenticated") {
      setError("Please log in to view your profile")
      setIsLoading(false)
      return
    }

    if (session) {
      fetchProfileData()
    }

    return () => {
      cancelled = true
    }
  }, [session, status])

  const handleDownloadBusinessLicense = () => {
    if (companyInformation.businessLicense) {
      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = companyInformation.businessLicense
      link.download = "business-license.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      console.log("No business license available for download")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="bg-emerald-500 hover:bg-emerald-600">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const agencyId = session?.user?.id || null

  return (
    <div className="min-h-screen">
      {/* Profile Header */}
      <div className="p-6 flex items-center justify-between relative h-[100px] rounded-[15px] border border-white/70 overflow-hidden shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="absolute inset-0 w-full h-full opacity-100 overflow-hidden">
          <Image
            src="/placeholder.svg?height=100&width=800"
            alt="Background"
            fill
            className="object-cover"
            quality={80}
            priority={false}
          />
        </div>

        <div className="absolute inset-0 backdrop-blur-[12px] bg-white/40"></div>

        <div className="flex items-center gap-4 relative z-10">
          {/* Profile Image with Upload Option */}
          <div className="relative group">
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white/60 backdrop-blur-sm relative">
              <Image
                src={profileData.avatarUrl || "/placeholder.svg?height=48&width=48&text=U"}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>

            {/* Upload Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageUpload}
                disabled={isUploading}
              />
            </div>

            {/* Uploading Indicator */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div>
            <h1 className="font-medium text-lg text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {profileData.name || "Loading..."}
            </h1>
            <p className="text-base text-gray-600 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {profileData.email || "Loading..."}
            </p>

            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            {uploadSuccess && <p className="text-green-500 text-xs mt-1">{uploadSuccess}</p>}
          </div>
        </div>

        <Button
          variant="outline"
          className="rounded-full bg-white/80 text-sm px-5 py-2 h-10 border-white/60 relative z-10 hover:bg-white backdrop-blur-sm transition-all shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        >
          <span className="font-medium">OVERVIEW</span>
        </Button>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Full Name:</span>
                <span className="text-sm text-gray-600 col-span-2">{profileData.fullName || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Mobile:</span>
                <span className="text-sm text-gray-600 col-span-2">{profileData.mobile || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-gray-600 col-span-2">{profileData.email}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Location:</span>
                <span className="text-sm text-gray-600 col-span-2">{profileData.location || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Social Media:</span>
                <div className="flex gap-2 col-span-2">
                  <button className="text-teal-500 hover:text-teal-600">
                    <Facebook size={16} />
                  </button>
                  <button className="text-teal-500 hover:text-teal-600">
                    <Twitter size={16} />
                  </button>
                  <button className="text-teal-500 hover:text-teal-600">
                    <Instagram size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold whitespace-nowrap mr-4">Account Information</h2>

              <Button
                variant="default"
                className="bg-emerald-500 text-white rounded-full flex items-center gap-1 text-xs px-3 py-1.5 hover:bg-emerald-600 whitespace-nowrap"
                onClick={() => {
                  console.log("Opening bank details modal")
                  setShowBankDetailsModal(true)
                }}
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add bank details</span>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Username:</span>
                <span className="text-sm text-gray-600 col-span-2 flex items-center">
                  {accountData.username}
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-teal-500 rounded-full">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 1L3.5 6.5L1 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Password:</span>
                <div className="flex items-center col-span-2">
                  <span className="text-sm text-gray-600 mr-2">
                    {showPassword ? "password123" : accountData.password}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#0F3F2F] hover:text-[#0F3F2F]/80"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Role:</span>
                <span className="text-sm text-gray-600 col-span-2">{accountData.role}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Location:</span>
                <span className="text-sm text-gray-600 col-span-2">{accountData.location || "N/A"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Account Status:</span>
                <span
                  className={`text-sm font-medium col-span-2 ${accountData.status === "Active" ? "text-green-600" : "text-gray-600"}`}
                >
                  {accountData.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Last logged in:</span>
                <span className="text-sm text-gray-600 col-span-2">{accountData.lastLoggedIn}</span>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/placeholder.svg?height=16&width=16"
                alt="Team icon"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              <span className="font-semibold text-sm">TEAM</span>
            </div>

            <div className="space-y-4">
              {teamMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">No team members found</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full overflow-hidden ${member.avatarColor}`}>
                        <Image
                          src={member.avatarUrl || "/placeholder.svg?height=40&width=40&query=team member"}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500">Last logged in at {member.lastLoggedIn}</p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      className="bg-emerald-500 text-white rounded-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 hover:bg-emerald-600"
                      onClick={() => setShowComments(true)}
                    >
                      <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Add comment</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6 col-span-1 md:col-span-2 xl:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Company name:</span>
                <span className="text-sm text-gray-600">{companyInformation.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">GST registration:</span>
                <span className="text-sm text-gray-600">{companyInformation.gstRegistration}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">GST No.:</span>
                <span className="text-sm text-gray-600">{companyInformation.gstNo}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Owner name:</span>
                <span className="text-sm text-gray-600">{companyInformation.ownerName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Mobile:</span>
                <span className="text-sm text-gray-600">{companyInformation.mobile}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-gray-600">{companyInformation.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Website:</span>
                <span className="text-sm text-gray-600">{companyInformation.website}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Logo:</span>
                <div className="flex items-center">
                  <div className="h-8 w-34 mr-2">
                    <Image
                      src={companyInformation.logo || "/placeholder.svg?height=32&width=120&query=company logo"}
                      alt={`${companyInformation.name} Logo`}
                      width={300}
                      height={58}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Landing page skin:</span>
                <div className="mt-1 relative">
                  <div
                    className="w-8 h-8 rounded cursor-pointer border"
                    style={{ backgroundColor: color }}
                    data-testid="color-picker-button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Country:</span>
                <span className="text-sm text-gray-600">{companyInformation.country}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Business license / Registration certificate:</span>
                <button
                  className="text-[#0F3F2F]"
                  onClick={handleDownloadBusinessLicense}
                  disabled={!companyInformation.businessLicense}
                >
                  <div className="w-5 h-5">
                    <Image
                      src="/avatar/line-md_file-download-filled (1).png"
                      alt="Download business license"
                      width={20}
                      height={20}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Year of registration:</span>
                <span className="text-sm text-gray-600">{companyInformation.yearOfRegistration}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">PAN No.:</span>
                <span className="text-sm text-gray-600">{companyInformation.panNo}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">PAN Type:</span>
                <span className="text-sm text-gray-600">{companyInformation.panType}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Headquarters:</span>
                <span className="text-sm text-gray-600">{companyInformation.headquarters}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <span className="text-sm font-medium">Years of operation:</span>
                <span className="text-sm text-gray-600">{companyInformation.yearsOfOperation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Modal */}
      <AgencyBankDetailsModal
        isOpen={showBankDetailsModal}
        onClose={() => setShowBankDetailsModal(false)}
        agencyId={agencyId}
      />

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Team Member Details</DialogTitle>
          <div className="border rounded-lg p-4 mt-2">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={commentData?.authorAvatar || "/placeholder.svg?height=40&width=40&query=user avatar"}
                  alt={commentData?.author || "Author"}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">{commentData?.author ?? "Unknown Author"}</p>
                <p className="text-xs text-gray-500">{commentData?.timestamp ?? ""}</p>
              </div>
            </div>

            {/* New Comment Input */}
            <div className="mt-4 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                rows={3}
                placeholder="Add a note about this team member..."
              />
              <div className="flex justify-end gap-2">
                <Button onClick={() => setShowComments(false)} variant="outline" className="text-sm">
                  Cancel
                </Button>
                <Button onClick={handlePostComment} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm">
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
