"use client"
import { PlusCircle, Edit, Palette } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { AgencyBankDetailsModal } from "./add-bank-details"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { useColorIntegration } from '@/hooks/useColorIntegration'

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
  profileImage: { url: string; name: string } | null 
  updatedAt: Date | null
  createdAt: Date | null
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
  contactPerson: string
  agencyType: string
  designation: string
  gstRegistration: string
  gstNo: string
  ownerName: string
  mobile: string
  personalPhone: string
  email: string
  website: string
  logo: string | null
  country: string
  yearOfRegistration: string
  panNo: string
  panType: string
  status: string
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
  const [commentText, setCommentText] = useState("")
  const [color, setColor] = useState("#4ECDC4")
  const [tempColor, setTempColor] = useState("#4ECDC4")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null)
  
  // Logo editing states
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [logoUploadSuccess, setLogoUploadSuccess] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Use the color integration hook
  const { updateColor } = useColorIntegration({
    onColorChange: (newColor) => {
      console.log('Color updated in profile section:', newColor);
      setColor(newColor);
      setTempColor(newColor);
    }
  });

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadSuccess(null)

    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validImageTypes.includes(file.type)) {
      setUploadError("Please select a valid image file (JPEG, PNG, GIF, WEBP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
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

      const newProfileData = {
        ...profileData,
        avatarUrl: data.imageUrl,
      }
      setProfileData(newProfileData)

      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          profileData: newProfileData 
        } 
      }))

      setUploadSuccess("Profile image updated successfully!")
      setTimeout(() => setUploadSuccess(null), 3000)

    } catch (error) {
      console.error("Error uploading profile image:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload image. Please try again.")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleCompanyLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLogoUploadError(null)
    setLogoUploadSuccess(null)

    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!validImageTypes.includes(file.type)) {
      setLogoUploadError("Please select a valid image file (JPEG, PNG, GIF, WEBP, SVG)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError("Image size must be less than 5MB")
      return
    }

    setIsLogoUploading(true)

    try {
      const formData = new FormData()
      formData.append("logo", file)

      const response = await fetch("/api/agencyform", {
        method: "PUT",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload logo")
      }

      setCompanyInformation((prev) => ({
        ...prev,
        logo: data.data?.logoPath || data.logoUrl,
      }))

      setLogoUploadSuccess("Company logo updated successfully!")
      toast.success("Logo updated successfully!")

      setTimeout(() => setLogoUploadSuccess(null), 3000)

      window.dispatchEvent(new CustomEvent('logoUpdated', { 
        detail: { logoUrl: data.data?.logoPath || data.logoUrl } 
      }))

    } catch (error) {
      console.error("Error uploading company logo:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to upload logo. Please try again."
      setLogoUploadError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLogoUploading(false)
      event.target.value = ""
    }
  }

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor)
  }

  const handleColorSave = async () => {
    try {
      const formData = new FormData();
      formData.append('landingPageColor', tempColor);

      const response = await fetch('/api/agencyform', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update landing page color');
      }

      // Update local state
      setColor(tempColor);
      setCompanyInformation(prev => ({ 
        ...prev, 
        landingPageColor: tempColor 
      }));
      setShowColorPicker(false);
      
      // Update color across all components using the hook
      await updateColor(tempColor);

      toast.success('Landing page color updated successfully!');
    } catch (error) {
      console.error('Error updating landing page color:', error);
      toast.error('Failed to update landing page color. Please try again.');
    }
  };

  // Update the useEffect that loads company information
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const response = await fetch('/api/agencyform');
        const data = await response.json();
        
        if (data.data) {
          setCompanyInformation(data.data);
          // Initialize color state with company's color
          if (data.data.landingPageColor) {
            setColor(data.data.landingPageColor);
            setTempColor(data.data.landingPageColor);
            // Update color in topbar and sidebar
            await updateColor(data.data.landingPageColor);
          }
        }
      } catch (error) {
        console.error('Error loading company information:', error);
      }
    };

    loadCompanyInfo();
  }, [updateColor]);

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
    password: "",
    role: "",
    location: "",
    status: "",
    lastLoggedIn: "",
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [, setCommentData] = useState<CommentData | null>(null)
  const [companyInformation, setCompanyInformation] = useState<CompanyInformation>({
    name: "",
    contactPerson: "",
    agencyType: "",
    designation: "",
    gstRegistration: "",
    gstNo: "",
    ownerName: "",
    mobile: "",
    personalPhone: "",
    email: "",
    website: "",
    logo: null,
    country: "",
    yearOfRegistration: "",
    panNo: "",
    panType: "",
    status: "",
    headquarters: "",
    yearsOfOperation: "",
    landingPageColor: "#4ECDC4",
    businessLicense: null,
  })

  const handlePostComment = () => {
    console.log("Posted comment:", commentText)
    setCommentText("")
    setShowComments(false)
  }

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
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          throw new Error(errorMessage);
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
      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch profile data")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (session) {
      fetchProfileData()
    }

    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    let cancelled = false

    const fetchCompanyInfo = async () => {
      if (status !== "authenticated") return
      try {
        const res = await fetch("/api/agencyform", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
        
        if (!res.ok) return
        const json = await res.json()
        if (cancelled) return
        const data = json?.data
        if (!data) return
        
        setCompanyInformation((prev) => ({
          ...prev,
          name: data.name ?? prev.name,
          contactPerson: data.contactPerson ?? prev.contactPerson,
          agencyType: data.agencyType ?? prev.agencyType,
          designation: data.designation ?? prev.designation,
          gstRegistration: typeof data.gstRegistered === "boolean" ? (data.gstRegistered ? "Yes" : "No") : prev.gstRegistration,
          gstNo: data.gstNumber ?? prev.gstNo,
          ownerName: data.ownerName ?? prev.ownerName,
          mobile: data.phoneNumber ?? prev.mobile,
          email: data.email ?? prev.email,
          website: data.website ?? prev.website,
          logo: data.logoPath ?? prev.logo,
          country: data.country ?? prev.country,
          yearOfRegistration: data.yearOfRegistration ?? prev.yearOfRegistration,
          panNo: data.panNumber ?? prev.panNo,
          panType: data.panType ?? prev.panType,
          status: data.status ?? prev.status,
          headquarters: data.headquarters ?? prev.headquarters,
          yearsOfOperation: data.yearsOfOperation ?? prev.yearsOfOperation,
          landingPageColor: data.landingPageColor ?? prev.landingPageColor,
          businessLicense: data.businessLicensePath ?? prev.businessLicense,
        }))
        
        if (data.landingPageColor) {
          setColor(data.landingPageColor)
          setTempColor(data.landingPageColor)
        }
      } catch (error) {
        console.error("Error fetching company information:", error)
      }
    }

    fetchCompanyInfo()
    return () => {
      cancelled = true
    }
  }, [session, status])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!session?.user?.id) {
        console.log("No session user ID");
        return;
      }
      
      try {
        console.log("Fetching team members for agency:", session.user.id);
        
        const response = await fetch("/api/user", {
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error("Failed to fetch team members:", response.status);
          return;
        }
        
        const data = await response.json();
        console.log("Team members response:", data);
        
        if (data.success && Array.isArray(data.data)) {
           const formattedMembers = data.data.map((user: TeamMember) => ({
            id: user.id,
            name: user.name || "N/A",
            email: user.email || "N/A",
            avatarUrl: user.profileImage?.url || null,
            lastLoggedIn: user.updatedAt 
              ? new Date(user.updatedAt).toLocaleDateString() 
              : user.createdAt 
              ? new Date(user.createdAt).toLocaleDateString() 
              : "Never",
            avatarColor: "bg-blue-500"
          }));
          
          console.log(`✅ Formatted ${formattedMembers.length} team members`);
          setTeamMembers(formattedMembers);
        } else {
          console.log("No team members data in response");
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchTeamMembers();
    
    const handleUserCreated = () => {
      console.log("User created event received, refreshing team");
      fetchTeamMembers();
    };
    
    window.addEventListener('userCreated', handleUserCreated);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTeamMembers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('userCreated', handleUserCreated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  const handleDownloadBusinessLicense = async () => {
    if (!companyInformation.businessLicense) {
      toast.error("No business license available for download")
      return
    }

    try {
      toast.info("Preparing download...")
      
      const response = await fetch("/api/upload-license", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to get download URL")
      }

      const data = await response.json()
      
      if (!data.downloadUrl) {
        throw new Error("No download URL received")
      }

      const link = document.createElement("a")
      link.href = data.downloadUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      
      const filename = data.filename || 'business-license.pdf'
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Business license download started!")
    } catch (error) {
      console.error("Error downloading business license:", error)
      toast.error("Failed to download business license. The download link may have expired. Please refresh the page and try again.")
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
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative min-h-[100px] rounded-[15px] border border-white/70 overflow-hidden shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)]">
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

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <div className="relative group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-white/60 backdrop-blur-sm relative">
              <Image
                src={profileData.avatarUrl || "/placeholder.svg?height=48&width=48&text=U"}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <label htmlFor="profile-image-upload" className="cursor-pointer">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <div>
            <h1 className="font-medium text-base sm:text-lg text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {profileData.name || "Loading..."}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] break-all">
              {profileData.email || "Loading..."}
            </p>

            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            {uploadSuccess && <p className="text-green-500 text-xs mt-1">{uploadSuccess}</p>}
          </div>
        </div>

        <Button
          variant="outline"
          className="rounded-full bg-white/80 text-xs sm:text-sm px-4 sm:px-5 py-2 h-8 sm:h-10 border-white/60 relative z-10 hover:bg-white backdrop-blur-sm transition-all shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] w-full sm:w-auto"
        >
          <span className="font-medium">OVERVIEW</span>
        </Button>
      </div>

      <div className="container mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Profile Information</h2>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Full Name:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2 break-words">{profileData.fullName || "N/A"}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Mobile:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2">{companyInformation.mobile}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Email:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2 break-all">{profileData.email}</span>
              </div>
            
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Country:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2">{companyInformation.country}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold whitespace-nowrap">Account Information</h2>

              <Button
                variant="default"
                className="bg-emerald-500 text-white rounded-full flex items-center gap-1 text-xs px-3 py-1.5 hover:bg-emerald-600 whitespace-nowrap w-full sm:w-auto justify-center"
                onClick={() => {
                  console.log("Opening bank details modal")
                  setShowBankDetailsModal(true)
                }}
              >
                <PlusCircle className="w-3 h-3" />
                <span>Add bank details</span>
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Username:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2 flex items-center break-words">
                  {accountData.username}
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-teal-500 rounded-full flex-shrink-0">
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

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Role:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2">{accountData.role}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Location:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2">{companyInformation.country}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Account Status:</span>
                <span
                  className={`text-xs sm:text-sm font-medium sm:col-span-2 ${["Active", "APPROVED"].includes(companyInformation.status) ? "text-green-600" : "text-gray-600"}`}
                >
                  {companyInformation.status || "PENDING"}
                </span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Last logged in:</span>
                <span className="text-xs sm:text-sm text-gray-600 sm:col-span-2">{accountData.lastLoggedIn}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Image
                src="/placeholder.svg?height=16&width=16"
                alt="Team icon"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              <span className="font-semibold text-xs sm:text-sm">TEAM ({teamMembers.length})</span>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-gray-500 text-xs sm:text-sm">No team members found</p>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden ${member.avatarColor} flex-shrink-0`}>
                        <Image
                          src={member.avatarUrl || "/placeholder.svg?height=40&width=40&query=team member"}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                      
                        <p className="font-medium text-xs sm:text-sm truncate">{member.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">Last logged in: {member.lastLoggedIn}</p>
                      </div>
                    </div>
                    <Button
                      variant="default"
                      className="bg-emerald-500 text-white rounded-full flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-emerald-600 flex-shrink-0"
                      onClick={() => {
                        setSelectedTeamMember(member)
                        setShowComments(true)
                      }}
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Add comment</span>
                      <span className="sm:hidden">Comment</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mt-4 sm:mt-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Company Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Company name:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-words">{companyInformation.name}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Contact person:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-words">{companyInformation.contactPerson}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Agency type:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.agencyType}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Designation:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.designation}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">GST registration:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.gstRegistration}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">GST No.:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-all">{companyInformation.gstNo}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Owner name:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.ownerName}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Company mobile:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.mobile}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Personal mobile:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.personalPhone}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Email:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-all">{companyInformation.email}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Website:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-all">{companyInformation.website}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                <span className="text-xs sm:text-sm font-medium">Logo:</span>
                <div className="flex items-center gap-2">
                  <div className="h-12 w-32 relative group flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={companyInformation.logo || "/placeholder.svg?height=48&width=128&query=company logo"}
                      alt={`${companyInformation.name} Logo`}
                      width={128}
                      height={48}
                      className="object-contain w-full h-full p-1"
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <label htmlFor="company-logo-upload" className="cursor-pointer flex items-center gap-1 text-white text-xs">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </label>
                      <input
                        id="company-logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCompanyLogoUpload}
                        disabled={isLogoUploading}
                      />
                    </div>
                    
                    {isLogoUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {logoUploadError && <p className="text-red-500 text-xs mt-1 sm:col-start-2">{logoUploadError}</p>}
                {logoUploadSuccess && <p className="text-green-500 text-xs mt-1 sm:col-start-2">{logoUploadSuccess}</p>}
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                <span className="text-xs sm:text-sm font-medium">Landing page color:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-emerald-500 transition-colors bg-white"
                  >
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <Palette className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">{color}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Country:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.country}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Business license:</span>
                <button
                  className="text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-start"
                  onClick={handleDownloadBusinessLicense}
                  disabled={!companyInformation.businessLicense}
                  title={companyInformation.businessLicense ? "Download business license" : "No business license available"}
                >
                  <div className="w-5 h-5">
                    <Image
                      src="/avatar/line-md_file-download-filled (1).png"
                      alt="Download"
                      width={20}
                      height={20}
                      className={`w-full h-full object-contain ${!companyInformation.businessLicense ? 'opacity-50' : ''}`}
                    />
                  </div>
                  <span className="text-xs sm:text-sm">Download</span>
                </button>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Year of registration:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.yearOfRegistration}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">PAN No.:</span>
                <span className="text-xs sm:text-sm text-gray-600 break-all">{companyInformation.panNo}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">PAN Type:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.panType}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Headquarters:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.headquarters}</span>
              </div>

              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm font-medium">Years of operation:</span>
                <span className="text-xs sm:text-sm text-gray-600">{companyInformation.yearsOfOperation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AgencyBankDetailsModal
        isOpen={showBankDetailsModal}
        onClose={() => setShowBankDetailsModal(false)}
        agencyId={agencyId}
      />

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Team Member Details</DialogTitle>
          <div className="border rounded-lg p-4 mt-2">
            {selectedTeamMember && (
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={selectedTeamMember.avatarUrl || "/placeholder.svg?height=40&width=40&query=user avatar"}
                    alt={selectedTeamMember.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">{selectedTeamMember.name}</p>
                  <p className="text-xs text-gray-500">{selectedTeamMember.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Last logged in: {selectedTeamMember.lastLoggedIn}</p>
                </div>
              </div>
            )}

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

      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogTitle className="text-lg font-semibold mb-4">Choose Landing Page Color</DialogTitle>
          
          <div className="space-y-4">
            {/* Color Preview */}
            <div 
              className="w-full h-32 rounded-lg border-2 border-gray-200"
              style={{ backgroundColor: tempColor }}
            />
            
            {/* HTML5 Color Picker */}
            <div className="relative">
              <input
                type="color"
                value={tempColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-48 cursor-pointer rounded-lg"
                style={{
                  WebkitAppearance: 'none',
                  border: 'none',
                  borderRadius: '0.5rem'
                }}
              />
            </div>
            
            {/* Hex Input */}
            <div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 min-w-[60px]">
                  RGB
                </label>
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="#000000"
                />
                <span className="text-sm text-gray-500 min-w-[50px] text-right">100%</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTempColor(color)
                  setShowColorPicker(false)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleColorSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}