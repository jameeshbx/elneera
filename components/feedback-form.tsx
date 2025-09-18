"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Star, User, MessageSquare, Calendar, CheckCircle } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the props interface for FeedbackForm
interface FeedbackFormProps {
  enquiryId: string | null // Add enquiryId as a prop
}

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  label: string
}

function StarRating({ rating, onRatingChange, label }: StarRatingProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-600">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-0 border-none bg-transparent hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function TestimonialCard({ name, content, rating }: { name: string; content: string; rating: number }) {
  return (
    <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-sm">{name}</h4>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-white/90 leading-relaxed">{content}</p>
    </Card>
  )
}

export default function FeedbackForm({ enquiryId }: FeedbackFormProps) {
 
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    tripName: "",
    dateOfTrip: "",
    overallExperience: 0,
    accommodationQuality: 0,
    transportTransfers: 0,
    serviceFromTeam: 0,
    travelAgain: "",
    additionalComments: "",
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchEnquiryDetails = async () => {
      if (!enquiryId) return

      try {
        const response = await fetch(`/api/enquiries?id=${enquiryId}`)
        const data = await response.json()

        if (response.ok) {
          setFormData((prev) => ({
            ...prev,
            fullName: data.name || "",
            phoneNumber: data.phone || "",
            email: data.email || "",
            tripName: data.locations || "",
            dateOfTrip: data.estimatedDates || "",
          }))
        } else {
          console.error("Failed to fetch enquiry details:", data.error)
        }
      } catch (error) {
        console.error("Error fetching enquiry details:", error)
      }
    }

    fetchEnquiryDetails()
  }, [enquiryId])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryId,
          name: formData.fullName,
          phone: formData.phoneNumber,
          email: formData.email,
          destination: formData.tripName,
          dateRange: formData.dateOfTrip,
          overallExperience: formData.overallExperience,
          accommodationQuality: formData.accommodationQuality,
          transportTransfers: formData.transportTransfers,
          serviceFromTeam: formData.serviceFromTeam,
          travelAgain: formData.travelAgain === "yes",
          additionalComments: formData.additionalComments,
        }),
      })

      if (response.ok) {
        setShowSuccessModal(true)
        // Reset form after successful submission
        setFormData({
          fullName: "",
          phoneNumber: "",
          email: "",
          tripName: "",
          dateOfTrip: "",
          overallExperience: 0,
          accommodationQuality: 0,
          transportTransfers: 0,
          serviceFromTeam: 0,
          travelAgain: "",
          additionalComments: "",
        })
      } else {
        const errorData = await response.json()
        console.error("Error submitting feedback:", errorData)
        alert("Failed to submit feedback.")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("An error occurred while submitting feedback.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-gray-900">
              Feedback Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Thank you for sharing your experience with us. Your feedback helps us improve our services.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button
              onClick={handleCloseModal}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Left Side - Brand Section */}
      <div className="bg-[#026451] lg:w-1/2 px-10 pb-6 lg:px-16  flex flex-col justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="grid grid-cols-4 gap-2 h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-white rounded-full"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-6">
            Your feedback shapes our next adventure.
          </h1>
          <p className="text-white/90 text-sm mb-8 leading-relaxed">
            Your feedback is a key tool towards the Can Get, Feel, Review & Reimagine Your Next Journey !
          </p>

          {/* Testimonial Cards */}
          <div className="space-y-4 lg:space-y-6">
            <TestimonialCard
              name="Blake Hutchins"
              content="With Eineera we have been able more in journey country in 4 weeks. Incredible experience!"
              rating={5}
            />
            <div className="lg:ml-8">
              <TestimonialCard
                name="Sarah Johnson"
                content="Amazing service and unforgettable memories. Highly recommend for adventure seekers!"
                rating={5}
              />
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex gap-2 mt-6 justify-center lg:justify-start">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="lg:w-1/2  px-12 pb-10 bg-gray-50">
        <div className=" mx-auto">
          {/* Logo */}
          <div className=" ">
            <Image
              src="/elneera-logo.png"
              alt="Trekking Miles"
              width={176}  // Original dimensions
              height={64}
              className="w-[200px] h-auto  mx-auto object-contain" // Tailwind CSS scaling
              priority
            />
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Share Your Voyage Experience</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We value your insights! Please take a few moments to share your feedback about your recent trip with us.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your Details */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Your Details</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm text-gray-600">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm text-gray-600">
                    Phone number
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="phoneNumber"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      required
                    />
                    <MessageSquare className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-600">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Trip Details</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tripName" className="text-sm text-gray-600">
                    Trip name / Destination
                  </Label>
                  <Input
                    id="tripName"
                    placeholder="enter trip name or destination"
                    value={formData.tripName}
                    onChange={(e) => handleInputChange("tripName", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfTrip" className="text-sm text-gray-600">
                    Date of trip
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="dateOfTrip"
                      placeholder="enter date of trip"
                      value={formData.dateOfTrip}
                      onChange={(e) => handleInputChange("dateOfTrip", e.target.value)}
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Your Experience */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Rate Your Experience</h4>
              <div className="space-y-4">
                <StarRating
                  label="How would you rate your overall experience"
                  rating={formData.overallExperience}
                  onRatingChange={(rating) => handleInputChange("overallExperience", rating)}
                />
                <StarRating
                  label="Accommodation Quality"
                  rating={formData.accommodationQuality}
                  onRatingChange={(rating) => handleInputChange("accommodationQuality", rating)}
                />
                <StarRating
                  label="Transport & Transfers"
                  rating={formData.transportTransfers}
                  onRatingChange={(rating) => handleInputChange("transportTransfers", rating)}
                />
                <StarRating
                  label="Service from Our Team"
                  rating={formData.serviceFromTeam}
                  onRatingChange={(rating) => handleInputChange("serviceFromTeam", rating)}
                />
              </div>
            </div>

            {/* Your Feedback */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Your Feedback</h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600 mb-3 block">Would you travel with us again?</Label>
                  <RadioGroup
                    value={formData.travelAgain}
                    onValueChange={(value) => handleInputChange("travelAgain", value)}
                    className="flex gap-6"
                    required
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="text-sm">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="text-sm">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="comments" className="text-sm text-gray-600">
                    Any additional comments?
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Share your thoughts on how we can improve or what you loved about your trip!"
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange("additionalComments", e.target.value)}
                    className="mt-1 min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}