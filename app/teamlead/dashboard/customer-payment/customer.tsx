"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Download, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface PaymentData {
  upiId: string
  selectedBank: string
  transactionId: string
  id: string
  customerName: string
  itineraryReference: string
  totalCost: string
  amountPaid: string
  paymentDate: string
  remainingBalance: string
  paymentStatus: string
  shareMethod: "email"
  paymentLink: string
  currency: string
  enquiryId?: string
  selectedBankIndex?: number
  quotationAmount?: string
}

interface PaymentHistory {
  id: string
  sharepayment: "Bank Transfer" | "UPI Method" | "Cash" | "Payment Link"
  paidDate: string
  amountPaid: number
  pendingAmount: number
  status: string
  invoiceUrl?: string
}

interface CustomerPayment {
  id: string
  amountPaid: string
  paymentStatus: string
}

interface PaymentReminder {
  id: string
  type: string
  message: string
  time: string
  date: string
  status: "RECENT" | "SENT" | "PENDING"
}

interface BankAccount {
  accountHolderName: string
  bankName: string
  branchName?: string
  accountNumber: string
  ifscCode?: string
  bankCountry?: string
  currency?: string
  notes?: string
}

interface UpiMethod {
  provider: string
  id: string
}

interface QrCode {
  url: string
  name: string
}

interface AgencyPaymentMethods {
  bankAccounts: BankAccount[]
  upiMethods: UpiMethod[]
  paymentLinks: string[]
  qrCodes: QrCode[]
}

interface DMCItem {
  quotationAmount?: string
}

interface SharedDMC {
  selectedDMCs?: DMCItem[]
}

type PaymentMethodType = "Bank Transfer" | "UPI Method" | "Cash" | "Payment Link"

const PaymentOverviewForm: React.FC<{ paymentId?: string; enquiryId?: string; customerId?: string }> = ({
  paymentId,
  enquiryId,
  customerId,
}) => {
  
  const [customerName, setCustomerName] = useState<string>("")
  const [customerEmail, setCustomerEmail] = useState<string>("")
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("Bank Transfer")
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [agencyPaymentMethods, setAgencyPaymentMethods] = useState<AgencyPaymentMethods>({
    bankAccounts: [],
    upiMethods: [],
    paymentLinks: [],
    qrCodes: []
  })
  
  const [agencyInfo, setAgencyInfo] = useState<{ name: string; id: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [, setCustomerPayments] = useState<CustomerPayment[]>([])

  const [showShareModal, setShowShareModal] = useState(false)
  const [paymentChannel, setPaymentChannel] = useState("Bank transfer")
  const [shareFormData, setShareFormData] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    notes: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currency] = useState("USD")
  const [showBankDetails, setShowBankDetails] = useState(true)

  // Helper function to generate payment details HTML
  const generatePaymentDetailsHTML = () => {
    let paymentDetailsHTML = `<p><strong>Payment Method:</strong> ${selectedPaymentMethod}</p>`;

    if (selectedPaymentMethod === "Bank Transfer" && 
        typeof paymentData?.selectedBankIndex === "number" &&
        agencyPaymentMethods?.bankAccounts?.[paymentData.selectedBankIndex]) {
      
      const selectedBank = agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex];
      paymentDetailsHTML += `
        <div style="margin-top: 15px; padding: 15px; background-color: #e3f2fd; border-radius: 5px; border-left: 4px solid #2196f3;">
          <h4 style="color: #1976d2; margin-top: 0; margin-bottom: 10px;">Bank Transfer Details:</h4>
          <p style="margin: 5px 0;"><strong>Bank Name:</strong> ${selectedBank.bankName}</p>
          <p style="margin: 5px 0;"><strong>Account Holder Name:</strong> ${selectedBank.accountHolderName}</p>
          <p style="margin: 5px 0;"><strong>Account Number:</strong> ${selectedBank.accountNumber}</p>
          ${selectedBank.ifscCode ? `<p style="margin: 5px 0;"><strong>IFSC Code:</strong> ${selectedBank.ifscCode}</p>` : ''}
          ${selectedBank.branchName ? `<p style="margin: 5px 0;"><strong>Branch Name:</strong> ${selectedBank.branchName}</p>` : ''}
          ${selectedBank.bankCountry ? `<p style="margin: 5px 0;"><strong>Bank Country:</strong> ${selectedBank.bankCountry}</p>` : ''}
          ${selectedBank.currency ? `<p style="margin: 5px 0;"><strong>Currency:</strong> ${selectedBank.currency}</p>` : ''}
          ${selectedBank.notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${selectedBank.notes}</p>` : ''}
          ${paymentData?.transactionId ? `<p style="margin: 5px 0;"><strong>Reference Transaction ID:</strong> ${paymentData.transactionId}</p>` : ''}
        </div>`;
    } 
    else if (selectedPaymentMethod === "UPI Method" && paymentData?.upiId) {
      paymentDetailsHTML += `
        <div style="margin-top: 15px; padding: 15px; background-color: #e8f5e8; border-radius: 5px; border-left: 4px solid #4caf50;">
          <h4 style="color: #388e3c; margin-top: 0; margin-bottom: 10px;">UPI Payment Details:</h4>
          <p style="margin: 5px 0;"><strong>UPI ID:</strong> ${paymentData.upiId}</p>
          ${paymentData?.transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentData.transactionId}</p>` : ''}
          <p style="margin: 10px 0 5px 0; font-style: italic; color: #666;">Please use the above UPI ID to make your payment and share the transaction ID with us.</p>
        </div>`;
    }
    else if (selectedPaymentMethod === "Cash") {
      paymentDetailsHTML += `
        <div style="margin-top: 15px; padding: 15px; background-color: #fff3e0; border-radius: 5px; border-left: 4px solid #ff9800;">
          <h4 style="color: #f57c00; margin-top: 0; margin-bottom: 10px;">Cash Payment Details:</h4>
          <p style="margin: 5px 0;">Payment will be collected in cash. Please keep the exact amount ready.</p>
          <p style="margin: 10px 0 5px 0; font-style: italic; color: #666;">Our representative will collect the payment and provide you with a receipt.</p>
        </div>`;
    }
    else if (selectedPaymentMethod === "Payment Link" && paymentData?.paymentLink) {
      paymentDetailsHTML += `
        <div style="margin-top: 15px; padding: 15px; background-color: #f3e5f5; border-radius: 5px; border-left: 4px solid #9c27b0;">
          <h4 style="color: #7b1fa2; margin-top: 0; margin-bottom: 10px;">Online Payment Link:</h4>
          <p style="margin: 5px 0;"><a href="${paymentData.paymentLink}" style="color: #1976d2; text-decoration: none;">Click here to make payment</a></p>
          <p style="margin: 10px 0 5px 0; font-style: italic; color: #666;">Use the secure payment link above to complete your transaction online.</p>
        </div>`;
    }

    return paymentDetailsHTML;
  };

  // Handle payment channel change
  const handlePaymentChannelChange = (channel: "Bank transfer ( manual entry )" | "Cash" | "UPI") => {
    setPaymentChannel(channel)
    setShowBankDetails(channel === "Bank transfer ( manual entry )")

    if (channel === "Bank transfer ( manual entry )") {
      setSelectedPaymentMethod("Bank Transfer")
    } else if (channel === "Cash") {
      setSelectedPaymentMethod("Cash")
    } else if (channel === "UPI") {
      setSelectedPaymentMethod("UPI Method")
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Fixed handleSubmit function with complete payment details
  const handleSubmit = async () => {
    if (!paymentData || !customerEmail) {
      setError("Missing payment data or customer email")
      return
    }

    setIsLoading(true)
    try {
      // 1. First save the payment data
      const paymentPayload = {
        enquiryId,
        customerId,
        paymentMethod: selectedPaymentMethod,
        selectedBankIndex: paymentData.selectedBankIndex,
        amountPaid: paymentData.amountPaid,
        paymentDate: paymentData.paymentDate,
        paymentStatus: paymentData.paymentStatus,
        transactionId: paymentData.transactionId,
        upiId: paymentData.upiId,
        notes: shareFormData.notes,
      }

      const paymentResponse = await fetch("/api/auth/customer-payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Failed to save payment")
      }

      // 2. Generate payment details HTML
      const paymentDetailsHTML = generatePaymentDetailsHTML();

      // 3. Then send the email using POST method
      const emailData = {
        to: customerEmail,
        subject: `Payment Update for Itinerary ${paymentData.itineraryReference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #183F30;">Payment Update</h2>
            <p>Dear ${customerName},</p>
            <p>Your payment for itinerary <strong>${paymentData.itineraryReference}</strong> has been updated.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #183F30; margin-top: 0;">Payment Summary:</h3>
              <p><strong>Amount Paid:</strong> ${paymentData.amountPaid} ${paymentData.currency}</p>
              <p><strong>Remaining Balance:</strong> ${paymentData.remainingBalance} ${paymentData.currency}</p>
              <p><strong>Payment Status:</strong> ${paymentData.paymentStatus}</p>
            </div>

            ${paymentDetailsHTML}
            
            <p style="margin-top: 20px;">Thank you for your business!</p>
            <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      }

      const emailResponse = await fetch("/api/auth/customer-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      const emailResult = await emailResponse.json()

      if (!emailResult.success) {
        console.error("Failed to send email:", emailResult.error)
        setError("Payment saved but email failed to send: " + emailResult.error)
      } else {
        console.log("Email sent successfully:", emailResult.messageId)
        await fetchPaymentData()
        setError(null)
        alert("Payment updated and email sent successfully!")
      }

    } catch (error) {
      console.error("Error in submit:", error)
      setError(error instanceof Error ? error.message : "Failed to update payment")
    } finally {
      setIsLoading(false)
    }
  }

  // Separate function for just saving payment (without email)
  const handleSavePayment = async () => {
    if (!paymentData) return

    try {
      setIsLoading(true)

      const paymentPayload = {
        enquiryId,
        customerId,
        paymentMethod: selectedPaymentMethod,
        selectedBankIndex: paymentData.selectedBankIndex,
        amountPaid: paymentData.amountPaid,
        paymentDate: paymentData.paymentDate,
        paymentStatus: paymentData.paymentStatus,
        transactionId: paymentData.transactionId,
        upiId: paymentData.upiId,
        notes: shareFormData.notes,
      }

      const response = await fetch("/api/auth/customer-payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPaymentData()
        console.log("Payment saved successfully")
        setError(null)
        alert("Payment saved successfully!")
      } else {
        setError(result.error || "Failed to save payment")
      }
    } catch (error) {
      console.error("Error saving payment:", error)
      setError("Failed to save payment")
    } finally {
      setIsLoading(false)
    }
  }

  // Separate function for just sending email with complete payment details
  const sendPaymentEmail = async () => {
    if (!paymentData || !customerEmail) {
      setError("Missing payment data or customer email")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Generate payment details HTML
      const paymentDetailsHTML = generatePaymentDetailsHTML();
      
      const emailData = {
        to: customerEmail,
        subject: `Payment Update for Itinerary ${paymentData.itineraryReference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #183F30;">Payment Update</h2>
            <p>Dear ${customerName},</p>
            <p>Your payment for itinerary <strong>${paymentData.itineraryReference}</strong> has been updated.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #183F30; margin-top: 0;">Payment Summary:</h3>
              <p><strong>Amount Paid:</strong> ${paymentData.amountPaid} ${paymentData.currency}</p>
              <p><strong>Remaining Balance:</strong> ${paymentData.remainingBalance} ${paymentData.currency}</p>
              <p><strong>Payment Status:</strong> ${paymentData.paymentStatus}</p>
            </div>

            ${paymentDetailsHTML}
            
            <p style="margin-top: 20px;">Thank you for your business!</p>
            <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `,
      }

      console.log("Sending email with data:", emailData)

      const response = await fetch("/api/auth/customer-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()
      console.log("Email API response:", result)

      if (!result.success) {
        setError("Failed to send email: " + result.error)
      } else {
        console.log("Email sent successfully:", result.messageId)
        alert("Email sent successfully!")
        setError(null)
      }
    } catch (error) {
      console.error("Error sending email:", error)
      setError("Error sending email")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch agency payment methods
  const fetchAgencyPaymentMethods = async (agencyId: string) => {
    try {
      const response = await fetch(`/api/auth/add-bank-details?agencyId=${agencyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }
      const { paymentMethod } = await response.json()
      
      if (paymentMethod) {
        const transformedData = {
          bankAccounts: [],
          upiMethods: [],
          paymentLinks: [],
          qrCodes: []
        } as AgencyPaymentMethods;

        // Process bank accounts
        if (paymentMethod.bank && Array.isArray(paymentMethod.bank)) {
          transformedData.bankAccounts = paymentMethod.bank.map((bank: BankAccount) => ({
            accountHolderName: bank.accountHolderName || '',
            bankName: bank.bankName || '',
            accountNumber: bank.accountNumber || '',
            ifscCode: bank.ifscCode || '',
            branchName: bank.branchName || '',
            bankCountry: bank.bankCountry || '',
            currency: bank.currency || 'INR',
            notes: bank.notes || ''
          }));
        }

        // Process UPI methods
        if (paymentMethod.upiProvider && paymentMethod.identifier) {
          transformedData.upiMethods = [{
            provider: paymentMethod.upiProvider,
            id: paymentMethod.identifier
          }];
        }

        // Process payment links
        if (paymentMethod.paymentLink) {
          transformedData.paymentLinks = [paymentMethod.paymentLink];
        }

        // Process QR codes
        if (paymentMethod.qrCode) {
          transformedData.qrCodes = [{
            url: paymentMethod.qrCode.url,
            name: paymentMethod.qrCode.name || 'QR Code'
          }];
        }

        setAgencyPaymentMethods(transformedData);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      setError('Failed to load payment methods')
    }
  }

  // Fetch payment data on component mount and when refresh is triggered
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch user info to get agencyId
        const userRes = await fetch("/api/auth/user", { credentials: "include" })
        const userData = await userRes.json()

        if (!userData?.id) {
          setError("No agencyId found for user")
          return
        }

        const agencyId = userData.id
        
        // Fetch agency payment methods
        await fetchAgencyPaymentMethods(agencyId)

        // 2. Now fetch customer-payment details by agencyId
        const paymentRes = await fetch(`/api/payments/customer?id=${agencyId}`)
        const paymentData = await paymentRes.json()

        // 3. Set state with paymentData as needed
        setCustomerPayments(paymentData.data || [])
      } catch (err) {
        setError("Failed to fetch agency/payment details")
        console.error(err)
      }
    }
    
    fetchData()
  }, [])

  const fetchPaymentData = async () => {
    try {
      setLoading(true)

      // Fetch agency payment methods from customer-payment API
      const paymentMethodsResponse = await fetch(
        `/api/auth/customer-payment?enquiryId=${enquiryId || ""}&customerId=${customerId || ""}&paymentId=${paymentId || ""}`,
      )
      const paymentMethodsResult = await paymentMethodsResponse.json()

      if (paymentMethodsResult.success) {
        setAgencyPaymentMethods(paymentMethodsResult.data)
        setAgencyInfo(paymentMethodsResult.agency)
      }

      // Fetch shared DMC data to get quotation amount
      let quotationAmount = "0.00"
      if (enquiryId) {
        try {
          const shareDMCResponse = await fetch(`/api/share-dmc?enquiryId=${enquiryId}`)
          if (shareDMCResponse.ok) {
            const shareDMCData: { sharedDMCs?: SharedDMC[] } = await shareDMCResponse.json()
            // Find the first DMC with a quotation amount
            const dmcWithQuote = shareDMCData.sharedDMCs?.find((dmc: SharedDMC) => 
              dmc.selectedDMCs?.some((item: DMCItem) => item.quotationAmount)
            )
            if (dmcWithQuote) {
              const quotedItem = dmcWithQuote.selectedDMCs?.find((item: DMCItem) => item.quotationAmount)
              if (quotedItem && quotedItem.quotationAmount) {
                quotationAmount = quotedItem.quotationAmount.toString()
              }
            }
          }
        } catch (error) {
          console.error('Error fetching share-dmc data:', error)
        }
      }

      // Fetch markup price from commissions table
      const commissionResponse = await fetch(`/api/commission?enquiryId=${enquiryId}`)
      const commissionData = await commissionResponse.json()
      const markupPrice = commissionData?.markupPrice || "0.00"

      if (!paymentId) {
        // Use the first available bank details if exists
        const defaultBank = paymentMethodsResult.data?.bankAccounts?.[0]

        setPaymentData({
          id: "demo-payment-1",
          customerName: "John Doe",
          itineraryReference: "IT-2025-001",
          totalCost: quotationAmount,
          quotationAmount: quotationAmount,
          amountPaid: "0.00",
          paymentDate: new Date().toISOString().split("T")[0],
          remainingBalance: markupPrice,
          paymentStatus: "Pending",
          shareMethod: "email",
          paymentLink: "",
          currency: defaultBank?.currency || "USD",
          upiId: "",
          selectedBank: "",
          transactionId: "",
        })
        setPaymentHistory([
          {
            id: "1",
            paidDate: "12 - 04 - 25",
            sharepayment: "Bank Transfer",
            amountPaid: 500.0,
            pendingAmount: 780.0,
            status: "PARTIALLY PAID",
            invoiceUrl: "#",
          },
        ])
        setReminders([
          {
            id: "1",
            type: "Payment pending",
            message:
              "Customer is satisfied with the entire itinerary. No changes requested. Proceeding with confirmation and sending to DMC.",
            time: "02:00 PM",
            date: "Today",
            status: "RECENT",
          },
        ])
        setLoading(false)
        return
      }

      const response = await fetch(
        `/api/payments/customer?enquiryId=${encodeURIComponent(enquiryId || "")}&customerId=${encodeURIComponent(customerId || "")}`,
      )
      const result = await response.json()
      if (result.success) {
        // Ensure enquiryId is present in paymentData
        const payment = result.data.payment
        setPaymentData({ ...payment, enquiryId: payment.enquiryId || payment.enquiry_id })
        setPaymentHistory(result.data.history)
        setReminders(result.data.reminders)
      } else {
        setError(result.error || "Failed to fetch payment data")
      }
    } catch (error) {
      console.error("Error fetching payment data:", error)
      setError("Failed to fetch payment data")
    } finally {
      setLoading(false)
    }
  }

  const renderPaymentMethodDetails = () => {
    if (!agencyPaymentMethods) return null
  
    return <></>;
  }

  const handleInputChange = (field: keyof PaymentData, value: string) => {
    if (!paymentData) return

    setPaymentData((prev) => {
      if (!prev) return null
      const updated = { ...prev, [field]: value }

      // Auto-calculate remaining balance when total cost or amount paid changes
      if (field === "totalCost" || field === "amountPaid") {
        const total = Number.parseFloat(field === "totalCost" ? value : prev.totalCost) || 0
        const paid = Number.parseFloat(field === "amountPaid" ? value : prev.amountPaid) || 0
        updated.remainingBalance = (total - paid).toFixed(2)
      }

      return updated
    })
  }

  // Fetch customer name and email from enquiry table using enquiryId from URL
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (!enquiryId) return
      try {
        const res = await fetch(`/api/enquiries?id=${enquiryId}`)
        const result = await res.json()
        if (result && result.name) {
          setCustomerName(result.name)
          setCustomerEmail(result.email || "")
        } else if (result?.data?.name) {
          setCustomerName(result.data.name)
          setCustomerEmail(result.data.email || "")
        } else {
          setCustomerName("")
          setCustomerEmail("")
        }
      } catch {
        setCustomerName("")
        setCustomerEmail("")
      }
    }
    fetchCustomerInfo()
  }, [enquiryId])

  const handleShareInputChange = (field: string, value: string) => {
    setShareFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyLink = () => {
    if (paymentData?.paymentLink) {
      navigator.clipboard.writeText(paymentData.paymentLink)
      alert("Payment link copied to clipboard!")
    }
  }

  const handleShare = () => {
    console.log("Sharing with data:", { paymentChannel, ...shareFormData })
    setShowShareModal(false)
    // Reset form
    setShareFormData({ name: "", email: "", whatsappNumber: "", notes: "" })
    setPaymentChannel("")
  }

  // Updated handleSendReminder function with complete payment details
  const handleSendReminder = async () => {
    if (!paymentData || !customerEmail) {
      setError("Missing payment data or customer email")
      return
    }

    try {
      setShowProgress(true)
      
      // Generate payment details HTML
      const paymentDetailsHTML = generatePaymentDetailsHTML();
      
      const emailData = {
        to: customerEmail,
        subject: `Payment Reminder for Itinerary ${paymentData.itineraryReference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #183F30;">Payment Reminder</h2>
            <p>Dear ${customerName},</p>
            <p>This is a friendly reminder about your pending payment for itinerary <strong>${paymentData.itineraryReference}</strong>.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #183F30; margin-top: 0;">Payment Summary:</h3>
              <p><strong>Total Amount:</strong> ${paymentData.totalCost} ${paymentData.currency}</p>
              <p><strong>Amount Paid:</strong> ${paymentData.amountPaid} ${paymentData.currency}</p>
              <p><strong>Remaining Balance:</strong> ${paymentData.remainingBalance} ${paymentData.currency}</p>
              <p><strong>Payment Status:</strong> ${paymentData.paymentStatus}</p>
            </div>

            ${paymentDetailsHTML}
            
            <p style="margin-top: 20px;">Please complete your payment at your earliest convenience.</p>
            <p>Thank you for your business!</p>
            <p style="color: #666; font-size: 12px;">This is an automated reminder. Please do not reply to this email.</p>
          </div>
        `,
      }

      const response = await fetch("/api/auth/customer-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()

      if (!result.success) {
        setError("Failed to send reminder: " + result.error)
      } else {
        console.log("Reminder sent successfully:", result.messageId)
        await fetchPaymentData()
        setError(null)
        alert("Reminder sent successfully!")
      }
    } catch (error) {
      setError("Failed to send reminder")
      console.error("Error sending reminder:", error)
    } finally {
      setShowProgress(false)
    }
  }

  useEffect(() => {
    fetchPaymentData()
  }, [paymentId, refreshTrigger])

  // Function to trigger refresh from external components
  const refreshPaymentMethods = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Listen for bank details updates from other components
  useEffect(() => {
    const handleBankDetailsUpdate = () => {
      refreshPaymentMethods()
    }

    window.addEventListener("bankDetailsUpdated", handleBankDetailsUpdate)
    return () => {
      window.removeEventListener("bankDetailsUpdated", handleBankDetailsUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPaymentData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">No payment data found</p>
      </div>
    )
  }

  const completionPercentage =
    paymentData.paymentStatus === "Paid" ? 100 : paymentData.paymentStatus === "Partial" ? 70 : 30

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg border border-red-200">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Agency Info Display */}
        {agencyInfo && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Agency:</strong> {agencyInfo.name}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Payment Overview */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:p-6">
              {/* Progress Bar */}
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4">Payment Overview & {selectedPaymentMethod}</h2>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-800 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm text-gray-600">{completionPercentage}% Complete</span>
                </div>
              </div>

              {renderPaymentMethodDetails()}

              {/* Show selected bank details when Bank Transfer is selected */}
              {selectedPaymentMethod === "Bank Transfer" &&
                typeof paymentData?.selectedBankIndex === "number" &&
                agencyPaymentMethods &&
                agencyPaymentMethods.bankAccounts &&
                agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex] && (
                  <div className="mb-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                    <h5 className="text-blue-900 font-semibold mb-2">Selected Bank Details</h5>
                    <div className="text-sm">
                      <div>
                        <span className="font-medium">Bank Name:</span>{" "}
                        {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].bankName}
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span>{" "}
                        {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].accountNumber}
                      </div>
                      <div>
                        <span className="font-medium">Account Holder:</span>{" "}
                        {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].accountHolderName}
                      </div>
                      {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].ifscCode && (
                        <div>
                          <span className="font-medium">IFSC Code:</span>{" "}
                          {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].ifscCode}
                        </div>
                      )}
                      {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].branchName && (
                        <div>
                          <span className="font-medium">Branch:</span>{" "}
                          {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].branchName}
                        </div>
                      )}
                      {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].currency && (
                        <div>
                          <span className="font-medium">Currency:</span>{" "}
                          {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].currency}
                        </div>
                      )}
                      {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].notes && (
                        <div>
                          <span className="font-medium">Notes:</span>{" "}
                          {agencyPaymentMethods.bankAccounts[paymentData.selectedBankIndex].notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Customer name:</label>
                  <input
                    type="text"
                    value={customerName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-800 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Itinerary Reference ID:</label>
                  <input
                    type="text"
                    value={paymentData.itineraryReference}
                    onChange={(e) => handleInputChange("itineraryReference", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="space-y-4">
                  {/* Total Itinerary Cost */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      Total Itinerary Cost
                      <Info className="w-4 h-4 ml-1 text-gray-400" />
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.quotationAmount}
                        onChange={(e) => handleInputChange("totalCost", e.target.value)}
                        
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-gray-100"
                        readOnly
                      />
                      <select
                        value={currency}
                        disabled
                        className="px-2 sm:px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option>{currency}</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount paid</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.amountPaid}
                        onChange={(e) => handleInputChange("amountPaid", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                      <select
                        value={currency}
                        disabled
                        className="px-2 sm:px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option>{currency}</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    />
                  </div>

                  {/* Remaining Balance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.remainingBalance}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-100 text-sm"
                        readOnly
                      />
                      <select
                        value={currency}
                        disabled
                        className="px-2 sm:px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option>{currency}</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment status</label>
                    <select
                      value={paymentData.paymentStatus}
                      onChange={(e) => handleInputChange("paymentStatus", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* Payment Channel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Channel</label>
                    <select
                      value={paymentChannel}
                      onChange={(e) =>
                        handlePaymentChannelChange(e.target.value as "Bank transfer ( manual entry )" | "Cash" | "UPI")
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="Bank transfer ( manual entry )">Bank transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>

                  {/* Conditional details below Payment Channel */}
                  {showBankDetails ? (
                    <div className="space-y-4">
                      {/* Transaction ID */}
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          Transaction ID
                          <Info className="w-4 h-4 ml-1 text-gray-400" />
                        </label>
                        <input
                          type="text"
                          value={paymentData.transactionId || ""}
                          onChange={(e) => handleInputChange("transactionId", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Choose Bank */}
                      {agencyPaymentMethods?.bankAccounts && agencyPaymentMethods.bankAccounts.length > 0 ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700 mb-3">Choose bank account for reference</p>
                          <div className="space-y-2">
                            {agencyPaymentMethods.bankAccounts.map((bank, index) => (
                              <div key={index} className="flex items-start sm:items-center">
                                <input
                                  type="radio"
                                  name="bankAccount"
                                  checked={paymentData.selectedBankIndex === index}
                                  onChange={() => {
                                    setPaymentData(prev => prev ? { ...prev, selectedBankIndex: index } : prev);
                                    handleInputChange("selectedBank", `${bank.bankName} (${bank.accountNumber})`);
                                  }}
                                  className="mr-3 mt-0.5 sm:mt-0 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {bank.bankName} ({bank.accountNumber})
                                  {bank.ifscCode && ` • IFSC: ${bank.ifscCode}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-700">No bank accounts found. Please add bank details in your account settings.</p>
                        </div>
                      )}
                    </div>
                  ) : paymentChannel === "UPI" ? (
                    <div className="space-y-4">
                      {/* UPI ID */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                        {agencyPaymentMethods?.upiMethods && agencyPaymentMethods.upiMethods.length > 0 ? (
                          <select
                            value={paymentData.upiId}
                            onChange={(e) => handleInputChange("upiId", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select UPI ID</option>
                            {agencyPaymentMethods.upiMethods.map((upi, index) => (
                              <option key={index} value={upi.id}>
                                {upi.provider} - {upi.id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={paymentData.upiId || ""}
                            onChange={(e) => handleInputChange("upiId", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder="Enter UPI ID"
                          />
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        {agencyPaymentMethods?.qrCodes && agencyPaymentMethods.qrCodes.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-gray-700">Available QR Codes</p>
                            <div className="grid grid-cols-2 gap-3">
                              {agencyPaymentMethods.qrCodes.map((qr, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <img 
                                    src={qr.url} 
                                    alt={qr.name} 
                                    className="w-24 h-24 object-contain border border-gray-200 rounded-md p-1"
                                  />
                                  <span className="text-xs text-gray-600 mt-1 text-center">{qr.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-600">QR Code</span>
                              {selectedFile && (
                                <span className="text-xs text-green-600 mt-1">Selected: {selectedFile.name}</span>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="file"
                                id="qr-upload"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept="image/*"
                              />
                              <label
                                htmlFor="qr-upload"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium cursor-pointer block"
                              >
                                Choose File
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Attach Receipt - Only show for UPI and Bank Transfer */}
                  {(paymentChannel === "UPI" || paymentChannel === "Bank transfer ( manual entry )") && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">Attach receipts / Screenshots</span>
                        {selectedFile && (
                          <span className="text-xs text-green-600 mt-1">Selected: {selectedFile.name}</span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <label
                          htmlFor="file-upload"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm font-medium cursor-pointer block"
                        >
                          Choose File
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-medium flex-1"
                    >
                      {isLoading ? "UPDATING..." : "UPDATE & SEND EMAIL"}
                    </Button>
                    
                    <Button
                      onClick={handleSavePayment}
                      disabled={isLoading}
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50 px-6 py-2 font-medium flex-1"
                    >
                      {isLoading ? "SAVING..." : "SAVE ONLY"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Share Payment Link & Send Reminder */}
          <div className="space-y-4 sm:space-y-6">
            {/* Dynamic Payment Method Display */}
            {selectedPaymentMethod === "Payment Link" && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                    Payment Link Sharing
                  </h3>
                  <Button
                    onClick={() => setShowShareModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                    Share Link
                  </Button>
                </div>

                {agencyPaymentMethods?.paymentLinks && agencyPaymentMethods.paymentLinks.length > 0 ? (
                  <div className="space-y-3">
                    {agencyPaymentMethods.paymentLinks.map((link, index) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-900">Payment Gateway #{index + 1}</span>
                          <span className="bg-orange-100 px-2 py-1 rounded text-xs font-medium text-orange-800">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={link}
                            readOnly
                            className="flex-1 text-sm text-blue-600 bg-white border border-orange-200 rounded px-3 py-2"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(link)}
                            className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                          >
                            Copy
                          </button>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <p className="text-orange-600 font-medium mb-1">No Payment Links Available</p>
                    <p className="text-orange-500 text-sm">Add payment gateway links in your profile</p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> Payment links will redirect customers to secure payment gateways for online
                    transactions.
                  </p>
                </div>
              </div>
            )}

            {/* General Share Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Share Payment Details</h3>
                <Button
                  onClick={() => setShowShareModal(true)}
                  className="bg-[#183F30] hover:bg-emerald-800 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  Share Details
                </Button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Share via:</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shareMethod"
                      value="email"
                      checked={paymentData.shareMethod === "email"}
                      onChange={(e) => handleInputChange("shareMethod", e.target.value)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSendReminder}
                disabled={showProgress || !customerEmail}
                className="w-full px-4 py-2 bg-[#183F30] text-white rounded-md hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-4 text-sm"
              >
               {showProgress ? "Sending..." : "Send via Email"}
              </button>

              {!customerEmail && (
                <p className="text-red-500 text-xs mb-4">Customer email not found. Please ensure customer email is available.</p>
              )}

              <div className="text-center text-gray-500 text-sm mb-4">or</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Payment Link</label>
                <div className="flex">
                  <input
                    type="text"
                    value={paymentData.paymentLink}
                    onChange={(e) => handleInputChange("paymentLink", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter custom payment link"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-r-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Send Reminder */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Send Reminder</h3>
                <button
                  onClick={handleSendReminder}
                  disabled={showProgress || !customerEmail}
                  className="px-3 sm:px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showProgress ? "Sending..." : "Send reminder"}
                </button>
              </div>

              <div className="space-y-3">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <div key={reminder.id} className="border-l-4 border-green-500 pl-4 pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{reminder.status}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1 text-sm">{reminder.type}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{reminder.message}</p>
                      <p className="text-xs text-gray-500">
                        {reminder.time}, {reminder.date}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No reminders sent yet</p>
                )}
              </div>
            </div>

            {/* Payment Summary Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <h3 className="text-base font-semibold mb-4">Payment History</h3>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid on
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paidDate}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.amountPaid.toFixed(2)} {paymentData.currency}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.pendingAmount.toFixed(2)} {paymentData.currency}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.status === "PAID" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {payment.invoiceUrl ? (
                              <a
                                href={payment.invoiceUrl}
                                download
                                className="flex items-center text-sm text-white bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No payment history available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden p-4">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg p-4 border mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Paid on:</span>
                          <span className="text-gray-900">{payment.paidDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Amount paid:</span>
                          <span className="text-gray-900">
                            {payment.amountPaid.toFixed(2)} {paymentData.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Pending:</span>
                          <span className="text-gray-900">
                            {payment.pendingAmount.toFixed(2)} {paymentData.currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Status:</span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === "PAID" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-gray-600 font-medium">Invoice:</span>
                          {payment.invoiceUrl ? (
                            <a
                              href={payment.invoiceUrl}
                              download
                              className="flex items-center text-sm text-white bg-gray-600 px-2 py-1 rounded"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No payment history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Share modes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-channel" className="text-sm font-medium text-gray-700">
                Payment channel*
              </Label>
              <Select value={paymentChannel} onValueChange={setPaymentChannel}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Bank transfer ( manual entry )" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank transfer ( manual entry )</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name*
                </Label>
                <Input
                  id="name"
                  value={shareFormData.name}
                  onChange={(e) => handleShareInputChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email*
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={shareFormData.email}
                  onChange={(e) => handleShareInputChange("email", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                Whatsapp Number*
              </Label>
              <Input
                id="whatsapp"
                value={shareFormData.whatsappNumber}
                onChange={(e) => handleShareInputChange("whatsappNumber", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={shareFormData.notes}
                onChange={(e) => handleShareInputChange("notes", e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleSavePayment}
                disabled={isLoading}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                {isLoading ? "Saving..." : "Save Payment"}
              </Button>

              <Button
                onClick={sendPaymentEmail}
                disabled={isLoading || !customerEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "Sending..." : "Send Email"}
              </Button>

              <Button 
                onClick={handleShare} 
                className="w-full bg-[#183F30] hover:bg-emerald-800 text-white py-2"
              >
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PaymentOverviewForm