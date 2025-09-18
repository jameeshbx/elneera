"use client"

import type React from "react"
import Image from 'next/image';
import { useState, useEffect, useRef } from "react"
import { Eye, Facebook, Twitter, Instagram, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dailog"
import { commentData } from "@/data/profile"


interface ProfileData {
  name: string;
  email: string;
  username: string;
  role: string;
  location: string;
  status: string;
  password?: string; // Optional since we might not always fetch it
  profileImage?: string; // Add profile image field
}

// Add this new interface
interface Manager {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLoggedIn?: string;
  profileImage?: string;
  avatarColor?: string;
}

export default function ProfilePage() {
  const [showComments, setShowComments] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Add this line with your other state declarations
  const [managers, setManagers] = useState<Manager[]>([]);

  

  // Add these two new state declarations:
  const [, setManagersLoading] = useState(true);
  const [, setManagersError] = useState<string | null>(null);
  // Function to handle image errors and provide fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder.svg";
  };


  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Upload image function
  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/auth/upload-profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update profile data with new image URL
        setProfileData(prev => prev ? { ...prev, profileImage: data.imageUrl } : null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  const handlePostComment = () => {
    console.log("Posted comment:", commentText)
    setCommentText("")
  }

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/auth/admin-profile");

        if (res.ok) {
          const data = await res.json();
          setProfileData({
            name: data.name || "N/A",
            email: data.email || "N/A",
            username: data.username || data.email || "N/A",
            role: data.role || "N/A",
            location: data.location || "N/A",
            status: data.status || "N/A",
            password: "", // Don't fetch actual password for security
            profileImage: data.profileImage || undefined,
          });
          setError(null);
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Failed to load profile data");
          setProfileData({
            name: "Failed to load",
            email: "Failed to load",
            username: "N/A",
            role: "N/A",
            location: "N/A",
            status: "N/A",
            password: "",
            profileImage: undefined
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Network error occurred");
        setProfileData({
          name: "Error",
          email: "Error",
          username: "N/A",
          role: "N/A",
          location: "N/A",
          status: "N/A",
          password: ""
        });
      } finally {
        setLoading(false);

      }
    };

    fetchProfile();
  }, []);

  // Add this new useEffect for fetching managers
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setManagersLoading(true);
        setManagersError(null);
        const res = await fetch("/api/auth/add-managers");
        if (res.ok) {
          const data = await res.json();
          setManagers(data);
        } else {
          throw new Error("Failed to fetch managers");
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
        setManagersError("Failed to load team members. Please try again.");
      } finally {
        setManagersLoading(false);
      }
    };
    fetchManagers();
  }, []);


  return (
    <div className="min-h-screen bg-gray-50">

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="p-6 flex items-center justify-between relative h-[100px] rounded-[15px] border border-white/70 overflow-hidden shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="absolute inset-0 w-full h-full opacity-100 overflow-hidden">
          <Image
            src="/background/Rectangle 41.png"
            alt="Background"
            fill
            className="object-cover"
            quality={80}
            priority={false}
          />
        </div>

        <div className="absolute inset-0 backdrop-blur-[12px] bg-white/40"></div>

        <div className="flex items-center gap-4 relative z-10">

          <div className="relative group">
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white/60 backdrop-blur-sm relative">
              <Image
                src={profileData?.profileImage || "/file.svg"}
                alt="Profile"
                fill
                className="object-cover"
                onError={handleImageError}
              />

              {!profileData?.profileImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm disabled:cursor-not-allowed"
                    title="Upload profile picture"
                  >
                    {uploadingImage ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={14} className="text-white" />
                    )}
                  </button>
                </div>
              )}


            </div>


          </div>
          <div>

            <h1 className="font-medium text-lg text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {profileData?.name || "Loading..."}
            </h1>
            <p className="text-base text-gray-600 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              {profileData?.email || "Loading..."}
            </p>
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
      <div className="container mx-auto p-4 mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Profile Information</h2>


          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Full Name:</span>
              <span className="text-sm text-gray-600 col-span-2"> {profileData?.name || "N/A"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-gray-600 col-span-2"> {profileData?.email || "N/A"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm text-gray-600 col-span-2">{profileData?.location || "N/A"}</span>
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
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4">Account Information</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Username:</span>
              <span className="text-sm text-gray-600 col-span-2">{profileData?.username || "N/A"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Password:</span>
              <div className="flex items-center col-span-2">
                <span className="text-sm text-gray-600 mr-2">{showPassword ? accountData.password : "••••••••"}</span>
                <button onClick={() => setShowPassword(!showPassword)} className="text-teal-500 hover:text-teal-600" title={showPassword ? "Hide password" : "Show password"}
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm text-gray-600 col-span-2">{profileData?.role || "N/A"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Location:</span>
              <span className="text-sm text-gray-600 col-span-2">{profileData?.location || "N/A"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Account Status:</span>
              <span className="text-sm text-gray-600 col-span-2"> {profileData?.status || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="p-6 bg-white rounded-lg shadow-md md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/background/Icon.svg"
              alt="Team icon"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            <h2 className="text-lg font-bold">TEAM</h2>
          </div>

          <div className="space-y-4">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full overflow-hidden ${manager.avatarColor}`}>

                    {/* Adding Profile-image for managers */}

                    <Image
                      src={manager.profileImage || "/file.svg"}
                      alt="Team Member"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{manager.name}</p>
                    <p className="text-xs text-gray-500">Last logged in at {manager.lastLoggedIn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5">
                      <Image
                        src="/background/Apple Notes Application (1).png"
                        alt="Notes"
                        width={20}
                        height={20}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      className="h-6 text-xs text-teal-500 hover:text-teal-600 hover:bg-transparent"
                      onClick={() => {
                        setShowComments(true)
                      }}
                    >
                      DETAILS
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Comments</DialogTitle>
          <div className="border rounded-lg p-4 mt-2">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={commentData.authorAvatar || "/file.svg"}
                  alt={commentData.author}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">{commentData.author}</p>
              </div>
            </div>

            {/* New Comment Input */}
            <div className="mt-4 space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full p-2 rounded-md text-sm focus:ring-2 focus:ring-light-green focus:outline-none bg-transparent"
                rows={3}
                placeholder="Write your comment here..."
              />
              <div className="flex justify-center gap-2">
                <Button onClick={handlePostComment} className="bg-light-green hover:bg-light-green text-white">
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
