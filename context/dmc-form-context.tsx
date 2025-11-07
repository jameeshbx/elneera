"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode } from "react"

interface DMCFormData {
  id?: string
  dmcName: string
  primaryContact: string
  phoneNumber: string
  designation: string
  ownerName: string
  ownerPhoneNumber: string
  email: string
  website: string
  primaryCountry: string
  destinationsCovered: string
  cities: string
  gstRegistration: "Yes" | "No"
  gstNo: string
  yearOfRegistration: string
  panNo: string
  panType: string
  headquarters: string
  country: string
  yearOfExperience: string
  primaryPhoneExtension: string
  ownerPhoneExtension: string
}

interface DMCFormContextType {
  formData: DMCFormData
  setFormData: React.Dispatch<React.SetStateAction<DMCFormData>>
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
  resetForm: () => void
  updateFormField: (field: keyof DMCFormData, value: any) => void
  refreshListVersion: number
  triggerRefresh: () => void
}

const defaultFormData: DMCFormData = {
  dmcName: "",
  primaryContact: "",
  phoneNumber: "",
  designation: "",
  ownerName: "",
  ownerPhoneNumber: "",
  email: "",
  website: "",
  primaryCountry: "",
  destinationsCovered: "",
  cities: "",
  gstRegistration: "Yes",
  gstNo: "",
  yearOfRegistration: "",
  panNo: "",
  panType: "",
  headquarters: "",
  country: "",
  yearOfExperience: "",
  primaryPhoneExtension: "+91",
  ownerPhoneExtension: "+91",
}

const DMCFormContext = createContext<DMCFormContextType | undefined>(undefined)

export function DMCFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<DMCFormData>(defaultFormData)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [refreshListVersion, setRefreshListVersion] = useState(0)

  const triggerRefresh = () => setRefreshListVersion((v) => v + 1)

  const resetForm = () => {
    setFormData(defaultFormData)
    setIsEditing(false)
    setEditingId(null)
  }

  const updateFormField = (field: keyof DMCFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DMCFormContext.Provider
      value={{
        formData,
        setFormData,
        isEditing,
        setIsEditing,
        editingId,
        setEditingId,
        resetForm,
        updateFormField,
        refreshListVersion,
        triggerRefresh,
      }}
    >
      {children}
    </DMCFormContext.Provider>
  )
}

export function useDMCForm() {
  const context = useContext(DMCFormContext)
  if (context === undefined) {
    throw new Error("useDMCForm must be used within a DMCFormProvider")
  }
  return context
}
