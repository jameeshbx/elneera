"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Textarea } from "@/components/ui/textarea"
import { QrCode } from "lucide-react"

interface StandaloneBankDetailsProps {
  isOpen: boolean
  onClose: () => void
  dmcId?: string | null
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

export function StandaloneBankDetails({ isOpen, onClose, dmcId = null }: StandaloneBankDetailsProps) {
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
    if (isOpen && dmcId) {
      setLoading(true)
      fetch(`/api/auth/standalone-payment?dmcId=${dmcId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.methods) {
            const bankDetails = data.data.methods.find((method: { type: string }) => method.type === "BANK_ACCOUNT")
            const upiDetails = data.data.methods.find((method: { type: string }) => method.type === "UPI")
            const gatewayDetails = data.data.methods.find((method: { type: string }) => method.type === "PAYMENT_GATEWAY")
            const qrDetails = data.data.methods.find((method: { type: string; qrCode?: { url: string } }) => method.type === "QR_CODE")

            if (bankDetails && bankDetails.bank && Array.isArray(bankDetails.bank) && bankDetails.bank.length > 0) {
              setBanks(bankDetails.bank)
              setIsUpdating(true)
            } else {
              // Reset to default empty bank if no existing data
              setBanks([
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
            }

            if (upiDetails) {
              setSelectedUpiProvider(upiDetails.upiProvider || "Google Pay UPI")
              setUpiId(upiDetails.identifier || "")
              setIsUpdating(true)
            }
            if (gatewayDetails) {
              setPaymentLink(gatewayDetails.paymentLink || "")
              setIsUpdating(true)
            }
            if (qrDetails && qrDetails.qrCode) {
              setExistingQrCodeUrl(qrDetails.qrCode.url)
              setIsUpdating(true)
            }

            if (bankDetails || upiDetails || gatewayDetails || qrDetails) {
              setIsUpdating(true)
            }
          } else {
            // No existing payment methods, set to saving mode
            setIsUpdating(false)
          }
        })
        .catch((error) => {
          console.error("Error fetching payment methods:", error)
          setIsUpdating(false)
          toast({
            title: "Error",
            description: "Failed to load existing payment details",
            variant: "destructive",
          })
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // Reset state when the form is closed or opened without a dmcId
      setBanks([
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
      setSelectedUpiProvider("Google Pay UPI")
      setUpiId("")
      setPaymentLink("")
      setQrFile(null)
      setExistingQrCodeUrl(null)
      setIsUpdating(false)
      setLoading(false)
    }
  }, [isOpen, dmcId])

  const updateBank = (idx: number, key: keyof Bank, value: string) => {
    const next = [...banks]
    next[idx][key] = value
    setBanks(next)
  }

  const handleSaveOrUpdate = async () => {
    if (!dmcId) {
      toast({
        title: "Error",
        description: "DMC ID is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const banksToSave = banks.filter((b) => b.accountHolderName.trim() || b.bankName.trim() || b.accountNumber.trim())

      const formData = new FormData()
      formData.append("dmcId", dmcId)
      formData.append("bank", JSON.stringify(banksToSave))
      formData.append("upiProvider", selectedUpiProvider)
      formData.append("upiId", upiId)
      formData.append("paymentLink", paymentLink)
      if (qrFile) formData.append("qrCode", qrFile)

      const res = await fetch("/api/auth/standalone-payment", {
        method: isUpdating ? "PUT" : "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save/update payment methods")

      toast({
        title: "Success",
        description: isUpdating ? "Payment methods updated successfully" : "Payment methods saved successfully",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save/update payment methods",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">Payment Methods</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ✕
            </Button>
          </div>

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
                    id="standalone-qrCode"
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
                      onClick={() => document.getElementById("standalone-qrCode")?.click()}
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
        </div>
      </div>
      <Toaster />
    </>
  )
}
