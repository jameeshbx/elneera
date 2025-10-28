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
  const [hasExistingMethods, setHasExistingMethods] = useState(false)
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
      const res = await fetch(`/api/auth/add-bank-details?agencyId=${agencyId}`)
      if (res.ok) {
        const { paymentMethod } = await res.json()
        if (paymentMethod) {
          // Handle bank accounts
          if (paymentMethod.bank && paymentMethod.bank.length > 0) {
            setBanks(paymentMethod.bank)
          } else {
            // Initialize with empty bank if none exists
            setBanks([{
              accountHolderName: "",
              bankName: "",
              branchName: "",
              accountNumber: "",
              ifscCode: "",
              bankCountry: "India",
              currency: "INR",
              notes: "",
            }])
          }

          // Handle UPI
          if (paymentMethod.upiProvider) setSelectedUpiProvider(paymentMethod.upiProvider)
          if (paymentMethod.identifier) setUpiId(paymentMethod.identifier)
          
          // Handle payment link
          if (paymentMethod.paymentLink) setPaymentLink(paymentMethod.paymentLink)
          
          // Handle QR code
          if (paymentMethod.qrCode?.url) {
            setExistingQrCodeUrl(paymentMethod.qrCode.url)
          }
          
          // Check if we have any existing payment methods
          const hasPaymentMethods = 
            (paymentMethod.bank && paymentMethod.bank.length > 0) ||
            paymentMethod.upiProvider ||
            paymentMethod.paymentLink ||
            paymentMethod.qrCode
            
          setHasExistingMethods(hasPaymentMethods)
          setIsUpdating(hasPaymentMethods)
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Failed to load payment data:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to load payment methods",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading payment data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateBank = (idx: number, key: keyof Bank, value: string) => {
    const next = [...banks]
    next[idx] = { ...next[idx], [key]: value }
    setBanks(next)
  }

  const handleSaveOrUpdate = async () => {
    console.log('Save/Update button clicked');
    console.log('Current agencyId:', agencyId);
    
    // Check for agencyId and ensure it's a string
    const currentAgencyId = agencyId || '';
    if (!currentAgencyId) {
      console.error('No agencyId provided');
      toast({
        title: "Session Error",
        description: "Unable to verify your session. Please refresh the page and try again.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    console.log('Starting save/update with agencyId:', agencyId);
    setSaving(true);
    
    // Add a small delay to ensure the loading state is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Filter out empty bank accounts
      const banksToSave = banks
        .map(bank => ({
          ...bank,
          accountHolderName: bank.accountHolderName?.trim() || '',
          bankName: bank.bankName?.trim() || '',
          accountNumber: bank.accountNumber?.trim() || '',
        }))
        .filter(bank => bank.accountHolderName || bank.bankName || bank.accountNumber);
      
      console.log('Banks to save:', banksToSave);

      // Validate at least one payment method is provided
      const hasBankDetails = banksToSave.length > 0;
      const hasUpiDetails = upiId?.trim() !== "";
      const hasPaymentLink = paymentLink?.trim() !== "";
      const hasQrCode = qrFile || existingQrCodeUrl;
      
      if (!hasBankDetails && !hasUpiDetails && !hasPaymentLink && !hasQrCode) {
        toast({
          title: "No Payment Method",
          description: "Please add at least one payment method (bank, UPI, payment link, or QR code)",
          variant: "destructive",
          duration: 5000,
        });
        setSaving(false);
        return;
      }

      const formData = new FormData()
      formData.append("agencyId", currentAgencyId)
      console.log('Created FormData with agencyId:', currentAgencyId);
      
      // Only include bank details if they exist
      if (hasBankDetails) {
        formData.append("bank", JSON.stringify(banksToSave))
      }
      
      // Only include UPI details if they exist
      if (hasUpiDetails && upiId) {
        formData.append("upiProvider", selectedUpiProvider)
        formData.append("upiId", upiId)
      }
      
      // Only include payment link if it exists
      if (hasPaymentLink && paymentLink) {
        formData.append("paymentLink", paymentLink)
      }
      
      // Include QR code file if a new one is uploaded
      if (qrFile) {
        formData.append("qrCode", qrFile)
      }

      console.log("Sending request to API with:", {
        agencyId,
        banksCount: banksToSave.length,
        hasUpi: hasUpiDetails,
        hasPaymentLink,
        hasQrFile: !!qrFile,
        isUpdate: isUpdating
      })

      try {
        console.log('Sending request to /api/auth/add-bank-details', {
          method: isUpdating ? 'PUT' : 'POST',
          body: Array.from(formData.entries()).map(([key, value]) => ({
            key,
            value: value instanceof File ? `[File: ${value.name}]` : value
          }))
        });
        
        const res = await fetch("/api/auth/add-bank-details", {
          method: isUpdating ? "PUT" : "POST",
          body: formData,
          // Don't set Content-Type header - let the browser set it with the correct boundary
        });
        
        console.log('Received response status:', res.status);

        // Define response type
        type ApiResponse = {
          success: boolean;
          data?: {
            id: string;
            accountHolderName: string;
            bankName: string;
            accountNumber: string;
            ifscCode?: string;
            branchName?: string;
            bankCountry?: string;
            currency?: string;
            notes?: string;
          };
          error?: string;
          message?: string;
        };
        
        // Handle response
        let data: ApiResponse
        try {
          data = await res.json() as ApiResponse;
          console.log("API response:", data);
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", jsonError);
          throw new Error("Invalid response from server");
        }

        if (!res.ok) {
          const errorMsg = data?.error || data?.message || `HTTP ${res.status}: Failed to ${isUpdating ? 'update' : 'save'} payment methods`
          throw new Error(errorMsg)
        }

        // Show success message
        toast({
          title: "Success",
          description: isUpdating 
            ? "Payment methods updated successfully" 
            : "Payment methods saved successfully",
        })

        // Set updating to true for future updates
        setIsUpdating(true)
        
        // If we have a new QR code, update the existing URL
        if (qrFile) {
          setExistingQrCodeUrl(URL.createObjectURL(qrFile))
        }

        // Trigger refresh in other components
        window.dispatchEvent(new CustomEvent('bankDetailsUpdated'))
        
        // Close the modal after a short delay
        setTimeout(() => {
          onClose()
        }, 1500)
        
      } catch (error) {
        console.error("API request failed:", error)
        throw error // Re-throw to be caught by the outer catch block
      }
      
    } catch (error) {
      console.error("Error in handleSaveOrUpdate:", error)
      
      let errorMessage = isUpdating 
        ? "Failed to update payment methods. " 
        : "Failed to save payment methods. "
      
      if (error instanceof Error) {
        // Handle specific error messages
        if (error.message.includes('network') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorMessage += "Please check your internet connection and try again."
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage += "You don't have permission to perform this action. Please log in again."
        } else if (error.message.includes('500')) {
          errorMessage += "Server error. Please try again later."
        } else {
          errorMessage += error.message
        }
      } else {
        errorMessage += "An unexpected error occurred. Please try again."
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds to allow reading longer messages
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
                  {saving 
                    ? hasExistingMethods 
                      ? "Updating..." 
                      : "Saving..." 
                    : hasExistingMethods 
                      ? "Update Details" 
                      : "Save Details"}
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
