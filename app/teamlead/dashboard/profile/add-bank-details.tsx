"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode } from "lucide-react"

interface AgencyBankDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  agencyId?: string | null
}

const countries = [
  { name: "India", code: "IN" },
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
]

type Bank = {
  accountHolderName: string
  bankName: string
  branchName?: string
  accountNumber: string
  ifscCode?: string
  bankCountry?: string
  currency?: string
  notes?: string
}

export function AgencyBankDetailsModal({ isOpen, onClose, agencyId = null }: AgencyBankDetailsModalProps) {
  const [banks, setBanks] = useState<Bank[]>([
    {
      accountHolderName: "",
      bankName: "",
      branchName: "",
      accountNumber: "",
      ifscCode: "",
      bankCountry: "India",
      currency: "INR",
      notes: "",
    },
  ])
  const [selectedUpiProvider, setSelectedUpiProvider] = useState("Google Pay UPI")
  const [upiId, setUpiId] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [existingQrCodeUrl, setExistingQrCodeUrl] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && agencyId) {
      loadExistingPaymentData()
    }
  }, [isOpen, agencyId])

  const loadExistingPaymentData = async () => {
    if (!agencyId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/agency-bank-details?agencyId=${agencyId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.paymentMethod) {
          const pm = data.paymentMethod
          if (pm.bank) {
            setBanks(Array.isArray(pm.bank) ? pm.bank : [pm.bank])
          }
          if (pm.upiProvider) setSelectedUpiProvider(pm.upiProvider)
          if (pm.identifier) setUpiId(pm.identifier)
          if (pm.paymentLink) setPaymentLink(pm.paymentLink)
          if (pm.qrCode?.url) setExistingQrCodeUrl(pm.qrCode.url)
          setIsUpdating(true)
        }
      }
    } catch (error) {
      console.error("Error loading payment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateBank = (idx: number, key: keyof Bank, value: string) => {
    const next = [...banks]
    next[idx][key] = value
    setBanks(next)
  }


 // In your handleSaveOrUpdate function, add proper error boundaries:
 const handleSaveOrUpdate = async () => {
  if (!agencyId) {
    toast({
      title: "Error",
      description: "Agency ID is required",
      variant: "destructive",
    })
    return
  }

  setSaving(true)
  try {
    const banksToSave = banks.filter((b) => 
      b.accountHolderName.trim() || b.bankName.trim() || b.accountNumber.trim()
    )

    // Validate at least one payment method
    if (banksToSave.length === 0 && !upiId.trim() && !paymentLink.trim() && !qrFile) {
      toast({
        title: "Error",
        description: "Please add at least one payment method (bank, UPI, or payment link)",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("agencyId", agencyId)
    formData.append("bank", JSON.stringify(banksToSave))
    formData.append("upiProvider", selectedUpiProvider)
    formData.append("upiId", upiId)
    formData.append("paymentLink", paymentLink)
    if (qrFile) formData.append("qrCode", qrFile)

    console.log("Sending request to API with:", {
      agencyId,
      banksCount: banksToSave.length,
      hasUpi: !!upiId,
      hasPaymentLink: !!paymentLink,
      hasQrFile: !!qrFile
    })

    const res = await fetch("/api/auth/add-bank-details", {
      method: isUpdating ? "PUT" : "POST",
      body: formData,
    })

    // Check if response is HTML (error page)
    const contentType = res.headers.get("content-type") || ""
    let data

    if (contentType.includes("application/json")) {
      data = await res.json()
      console.log("API JSON response:", data)
    } else {
      // Handle HTML/error responses
      const textContent = await res.text()
      console.error("Non-JSON response from API:", textContent.substring(0, 500))
      
      // Check if it's a Next.js error page
      if (textContent.includes("<!DOCTYPE html>") || textContent.includes("<html")) {
        throw new Error("Server encountered an internal error. Please check the server logs.")
      } else {
        throw new Error(`Unexpected server response: ${textContent.substring(0, 200)}...`)
      }
    }

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to save/update payment methods`)
    }

    toast({
      title: "Success",
      description: isUpdating ? "Payment methods updated successfully" : "Payment methods saved successfully",
    })

    onClose()
  } catch (error) {
    console.error("Error in handleSaveOrUpdate:", error)
    
    let errorMessage = "Failed to save/update payment methods"
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  } finally {
    setSaving(false)
  }
}

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agency Payment Methods</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading payment details...</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Bank Details Section */}
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2">Bank Details</h4>
                {banks.map((bank, idx) => (
                  <div key={idx} className="border p-4 rounded-lg mb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                        <Input
                          value={bank.accountHolderName}
                          onChange={(e) => updateBank(idx, "accountHolderName", e.target.value)}
                          placeholder="Enter account holder name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <Input
                          value={bank.bankName}
                          onChange={(e) => updateBank(idx, "bankName", e.target.value)}
                          placeholder="Enter bank name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                        <Input
                          value={bank.branchName}
                          onChange={(e) => updateBank(idx, "branchName", e.target.value)}
                          placeholder="Enter branch name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <Input
                          value={bank.accountNumber}
                          onChange={(e) => updateBank(idx, "accountNumber", e.target.value)}
                          placeholder="Enter account number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        <Input
                          value={bank.ifscCode}
                          onChange={(e) => updateBank(idx, "ifscCode", e.target.value)}
                          placeholder="Enter IFSC code"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Country</label>
                        <Select
                          value={bank.bankCountry}
                          onValueChange={(value) => updateBank(idx, "bankCountry", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.name}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <Input
                          value={bank.currency}
                          onChange={(e) => updateBank(idx, "currency", e.target.value)}
                          placeholder="Enter currency"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <Textarea
                        value={bank.notes}
                        onChange={(e) => updateBank(idx, "notes", e.target.value)}
                        placeholder="Enter any additional notes"
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* UPI Section */}
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2">UPI Details</h4>
                <div className="border p-4 rounded-lg mb-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UPI Provider</label>
                      <Select value={selectedUpiProvider} onValueChange={setSelectedUpiProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UPI provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Google Pay UPI">Google Pay UPI</SelectItem>
                          <SelectItem value="PhonePe UPI">PhonePe UPI</SelectItem>
                          <SelectItem value="Paytm UPI">Paytm UPI</SelectItem>
                          <SelectItem value="BHIM UPI">BHIM UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UPI ID</label>
                      <Input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="Enter UPI ID"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="border rounded-md mb-4">
                <div className="px-4 py-3 flex items-center gap-2">
                  <div className="bg-gray-100 p-2 rounded">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <span className="font-medium">QR Code</span>
                </div>
                <div className="px-4 pb-4">
                  <input
                    id="agency-qrCode"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center flex-1">
                      {qrFile ? (
                        <div>
                          <p className="text-sm text-green-600 font-medium">{qrFile.name}</p>
                          <p className="text-xs text-gray-500">New file selected</p>
                        </div>
                      ) : existingQrCodeUrl ? (
                        <div>
                          <img
                            src={existingQrCodeUrl || "/placeholder.svg"}
                            alt="QR Code"
                            className="w-32 h-32 mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-500">Current QR Code</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Upload QR Code</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="h-10 bg-green-500 hover:bg-green-600 text-white border-0"
                      onClick={() => document.getElementById("agency-qrCode")?.click()}
                      type="button"
                    >
                      {existingQrCodeUrl ? "Change" : "Upload"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Section */}
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-2">Payment Gateway</h4>
                <div className="border p-4 rounded-lg mb-2">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Link</label>
                      <Input
                        value={paymentLink}
                        onChange={(e) => setPaymentLink(e.target.value)}
                        placeholder="Enter payment gateway link"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-medium"
                  onClick={handleSaveOrUpdate}
                  disabled={saving || loading}
                >
                  {saving ? "Saving..." : isUpdating ? "Update Details" : "Save Details"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  )
}
