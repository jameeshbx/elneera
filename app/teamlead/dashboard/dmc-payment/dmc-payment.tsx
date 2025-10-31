"use client"

import type React from "react"
import { useState, useEffect } from "react"


interface PaymentRecord {
  id: string
  paymentDate: string
  transactionId: string | null
  amountPaid: number
  remainingBalance: number
  paymentStatus: string
  paymentChannel: string
  receiptUrl?: string | null
  receiptFile?: {
    id: string
    url: string
    name: string
  } | null
  enquiry?: {
    currency: string
  }
  currency?: string
}

import { useRouter, useSearchParams } from "next/navigation"
import { Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PaymentData {
  dmcName: string
  itineraryReference: string
  totalCost: string
  amountPaid: string
  paymentDate: string
  remainingBalance: string
  paymentStatus: string
  paymentChannel: "Bank transfer ( manual entry )" | "Payment gateway" | "Cash" | "UPI"
  transactionId: string
  selectedBank: string
  paymentGateway: string
  upiId?: string
}

interface Commission {
  dmc: {
    id: string
    name: string
    email?: string
  }
  quotationAmount: string
}

interface PaymentMethod {
  type: string
  bank?: Array<{
    bankName: string
    accountNumber: string
  }>
  paymentLink?: string
  identifier?: string  // For UPI ID
}

const DMCPaymentInterface: React.FC = () => {
  const { toast } = useToast();

  // ...existing state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const searchParams = useSearchParams()
  const enquiryId = searchParams.get("enquiryId")

  const [dmcId, setDmcId] = useState<string | null>(null)
  const [commission, setCommission] = useState<Commission | null>(null)
  const [, setShowBankDetails] = useState<boolean>(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currency, setCurrency] = useState<string>("USD")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData>(() => ({
    dmcName: "",
    itineraryReference: "",
    totalCost: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    remainingBalance: "0.00",
    paymentStatus: "PAID",
    paymentChannel: "Bank transfer ( manual entry )",
    transactionId: "",
    selectedBank: "",
    paymentGateway: "",
    upiId: "",
  }))

  useEffect(() => {
    if (enquiryId) {
      const fetchCommission = async () => {
        try {
          const response = await fetch(`/api/commission?enquiryId=${enquiryId}`)
          if (response.ok) {
            const data = await response.json()
            setCommission(data)
            setDmcId(data.dmc.id)
            setPaymentData((prev: PaymentData) => ({ ...prev, dmcName: data.dmc.name }))
          }
        } catch (error) {
          console.error("Error fetching commission:", error)
        }
      }

      fetchCommission()
    }
  }, [enquiryId])

  useEffect(() => {
    if (commission) {
      setPaymentData((prev) => ({ ...prev, totalCost: commission.quotationAmount }))
    }
  }, [commission])

  // Fetch payments for summary table
  useEffect(() => {
    if (enquiryId && dmcId) {
      fetch(`/api/dmc-payment?enquiryId=${enquiryId}&dmcId=${dmcId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPayments(data);
          else if (Array.isArray(data.payments)) setPayments(data.payments);
        })
        .catch((err) => {
          console.error('Error fetching payments:', err);
        });
    }
  }, [enquiryId, dmcId]);

  useEffect(() => {
    if (enquiryId) {
      const fetchCurrency = async () => {
        try {
          const response = await fetch(`/api/enquiries?id=${enquiryId}`)
          if (response.ok) {
            const data = await response.json()
            setCurrency(data.currency)
          }
        } catch (error) {
          console.error("Error fetching currency:", error)
        }
      }

      fetchCurrency()
    }
  }, [enquiryId])

  useEffect(() => {
    if (dmcId) {
      const fetchPaymentMethods = async () => {
        try {
          const response = await fetch(`/api/auth/standalone-payment?dmcId=${dmcId}`)
          if (response.ok) {
            const result = await response.json()
            const paymentMethodsData = (result.data.methods || []) as PaymentMethod[]
            setPaymentMethods(paymentMethodsData)

            // Set payment gateway link from the first available method
            const gateway = paymentMethodsData.find((pm) => pm.paymentLink)

            // Find UPI payment method if exists
            const upiMethod = paymentMethodsData.find(
              (pm) => pm.type === 'UPI' && pm.identifier
            )

            setPaymentData((prev) => ({
              ...prev,
              paymentGateway: gateway?.paymentLink || "",
              upiId: upiMethod?.identifier || prev.upiId || ""
            }))
          }
        } catch (error) {
          console.error("Error fetching payment methods:", error)
        }
      }

      fetchPaymentMethods()
    }
  }, [dmcId])


  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const handleInputChange = (field: keyof PaymentData, value: string) => {
    setPaymentData((prev: PaymentData) => {
      const newData = { ...prev, [field]: value };

      // Recalculate remaining balance when total cost or amount paid changes
      if (field === 'totalCost' || field === 'amountPaid') {
        const total = Number.parseFloat(field === 'totalCost' ? value : prev.totalCost) || 0;
        const paid = Number.parseFloat(field === 'amountPaid' ? value : prev.amountPaid) || 0;
        const remaining = total - paid;
        newData.remainingBalance = remaining >= 0 ? remaining.toFixed(2) : "0.00";
      }

      return newData;
    });
  }

  const handlePaymentChannelChange = (channel: "Bank transfer ( manual entry )" | "Payment gateway" | "Cash" | "UPI") => {
    setShowBankDetails(channel === "Bank transfer ( manual entry )")
    setPaymentData((prev: PaymentData) => ({
      ...prev,
      paymentChannel: channel,
      transactionId: channel === "Cash" ? "CASH" : prev.transactionId === "CASH" ? "" : prev.transactionId
    }))
  }

  const handleDownload = async (receiptFile: { id?: string; url?: string; name?: string } | null, fileName: string = 'receipt') => {
    if (!receiptFile) {
      toast({
        title: 'Error',
        description: 'File information is not available.',
        variant: 'destructive',
      });
      return;
    }



    try {
      let response: Response;
      let downloadUrl = '';
      let actualFileName = receiptFile.name || fileName;

      // If we have a direct URL, use it
      if (receiptFile.url) {
        // Check if it's a full URL or a relative path
        if (receiptFile.url.startsWith('http')) {
          // Direct URL download
          response = await fetch(receiptFile.url);
        } else {
          // Relative path - use our API with direct=true
          const url = receiptFile.url.startsWith('/')
            ? receiptFile.url.substring(1)
            : receiptFile.url;
          const apiUrl = `/api/files/${encodeURIComponent(url)}?direct=true`;
          console.log('Fetching file from API:', apiUrl);
          response = await fetch(apiUrl);
        }
      }
      // If we have a file ID, use the files API
      else if (receiptFile.id) {
        console.log('Fetching file by ID:', receiptFile.id);
        response = await fetch(`/api/files/${receiptFile.id}`);
      }
      // If we have neither, error out
      else {
        throw new Error('No valid file reference provided');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File download failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: response.url
        });
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      // Get the file data as a blob
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Received empty file');
      }

      downloadUrl = window.URL.createObjectURL(blob);

      // Get the filename from the content-disposition header or use the provided filename
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          actualFileName = filenameMatch[1].replace(/['"]/g, '');
        }
      } else {
        // Try to get file extension from the URL if available
        const url = receiptFile.url || '';
        const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
        if (extensionMatch) {
          const ext = extensionMatch[1];
          if (!actualFileName.endsWith(`.${ext}`)) {
            actualFileName = `${actualFileName}.${ext}`;
          }
        }
      }

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = actualFileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      // Show success message
      toast({
        title: 'Download started',
        description: 'Your file download has started.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: `Failed to download the file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // New function to handle invoice download
  const handleInvoiceDownload = async (paymentId: string) => {
    try {
      toast({
        title: 'Downloading Invoice',
        description: 'Your invoice download has started...',
        variant: 'default',
      });

      const response = await fetch(`/api/dmc-payment/invoice/${paymentId}`);

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status} ${response.statusText}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Received empty invoice file');
      }

      // Create download URL
      const downloadUrl = window.URL.createObjectURL(blob);

      // Get filename from content-disposition header or use default
      let fileName = `invoice-${paymentId}.pdf`;
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          fileName = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      toast({
        title: 'Invoice Downloaded',
        description: 'Invoice PDF has been downloaded successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: `Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB.",
          variant: "destructive",
        })
        return
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a valid file type (JPG, PNG, GIF, PDF, DOC, DOCX).",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)
      console.log("Selected file:", file.name)
    }
  }

  // In your handleSubmit function
  const handleSubmit = async () => {
    if (!enquiryId || !dmcId) {
      toast({ title: "Error", description: "Missing Enquiry ID or DMC ID.", variant: "destructive" })
      return
    }

    if (!selectedFile) {
      toast({ title: "Error", description: "Please select a receipt file to upload.", variant: "destructive" })
      return
    }

    if (!paymentData.amountPaid || Number.parseFloat(paymentData.amountPaid) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount paid.", variant: "destructive" })
      return
    }

    if (!paymentData.paymentDate) {
      toast({ title: "Error", description: "Please select a payment date.", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      const paymentFormData = new FormData()
      paymentFormData.append("dmcId", dmcId)
      paymentFormData.append("enquiryId", enquiryId)
      paymentFormData.append("amountPaid", paymentData.amountPaid)
      paymentFormData.append("paymentDate", new Date(paymentData.paymentDate).toISOString())
      paymentFormData.append("transactionId", paymentData.transactionId || "")
      paymentFormData.append("paymentChannel", paymentData.paymentChannel)
      paymentFormData.append("paymentStatus", paymentData.paymentStatus)
      paymentFormData.append("totalCost", paymentData.totalCost)
      paymentFormData.append("currency", currency)
      paymentFormData.append("selectedBank", paymentData.selectedBank ?? "")

      // Add the file with the correct field name
      if (selectedFile) {
        paymentFormData.append("receipt", selectedFile)
      }

      const paymentResponse = await fetch("/api/dmc-payment", {
        method: "POST",
        body: paymentFormData,
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || "Failed to save payment details.")
      }

      const savedPayment = await paymentResponse.json()
      console.log("Payment saved successfully:", savedPayment)

      // Refresh payments list
      const paymentsResponse = await fetch(`/api/dmc-payment?enquiryId=${enquiryId}&dmcId=${dmcId}`)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        setPayments(paymentsData)
      }

      // Send email notification
      if (commission?.dmc?.email) {
        try {
          const emailFormData = new FormData()
          emailFormData.append("to", commission.dmc.email)
          emailFormData.append("subject", `Payment Notification for Itinerary: ${savedPayment.itineraryReference}`)

          // Add payment details with proper data structure
          const emailPaymentDetails = {
            dmcName: commission.dmc.name,
            itineraryReference: savedPayment.itineraryReference,
            enquiryId: savedPayment.enquiryId,
            totalCost: savedPayment.totalCost.toString(),
            amountPaid: savedPayment.amountPaid.toString(),
            paymentDate: new Date(savedPayment.paymentDate).toLocaleDateString(),
            remainingBalance: savedPayment.remainingBalance.toString(),
            paymentStatus: savedPayment.paymentStatus,
            paymentChannel: savedPayment.paymentChannel,
            transactionId: savedPayment.transactionId,
            currency: savedPayment.enquiry?.currency || currency,
            receiptUrl: savedPayment.receiptUrl, // Use the URL from the saved payment
            upiId: paymentData.paymentChannel === 'UPI' ? paymentData.upiId : undefined // Include UPI ID only for UPI payments
          }

          emailFormData.append("paymentDetails", JSON.stringify(emailPaymentDetails))

          // Add file if it exists
          if (selectedFile) {
            emailFormData.append("file", selectedFile)
          }

          console.log("Sending email to:", commission.dmc.email)

          const emailResponse = await fetch("/api/send-dmc-payment-email", {
            method: "POST",
            body: emailFormData,
          })

          const responseData = await emailResponse.json()

          if (!emailResponse.ok) {
            console.warn("Failed to send email:", responseData)
            toast({
              title: "Payment Saved",
              description: `Payment saved successfully, but email notification failed: ${responseData.details || responseData.error}`,
              variant: "default",
            })
          } else {
            console.log("Email sent successfully:", responseData.messageId)
            toast({
              title: "Success",
              description: "Payment updated and email sent successfully!",
            })
          }
        } catch (error) {
          console.error("Error sending email:", error)
          const errorMessage = error instanceof Error ? error.message : "Failed to send email notification"
          toast({
            title: "Payment Saved",
            description: `Payment saved successfully, but email notification failed: ${errorMessage}`,
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Payment Saved",
          description: "Payment saved successfully, but DMC email is not available to send notification.",
        })
      }

      // Reset form
      setSelectedFile(null)
      setPaymentData((prev) => ({
        ...prev,
        amountPaid: "",
        paymentDate: "",
        transactionId: "",
        selectedBank: "",
      }))

      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
        router.push(`/agency-admin/dashboard/booking-details?enquiryId=${enquiryId}`)

    } catch (error) {
      console.error("Error in payment submission:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - DMC Payment Form */}
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm w-full lg:w-[640px]">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">DMC Payment</h1>

                {/* Progress Bar */}
                <div className="flex items-center mb-6">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                    <div className="bg-green-800 h-2 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">45% Complete</span>
                </div>
              </div>

              {/* DMC Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DMC name:</label>
                  <span className="text-sm text-gray-900">{paymentData.dmcName}</span>
                </div>
              </div>

              {/* Payment Overview */}
              <div className="mb-6">
                <h3 className="text-sm sm:text-md font-medium text-gray-900 mb-4">Payment overview</h3>

                {/* Payment Form Fields */}
                <div className="space-y-4">
                  {/* Download Notice */}
                  <div className="mb-4 p-3 bg-gray-100 rounded-md">
                    <span className="text-xs text-gray-600">Download manual itinerary web feed details</span>
                  </div>

                  {/* Total Itinerary Cost */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      Total Itinerary Cost
                      <Info className="w-4 h-4 ml-1 text-gray-400" />
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.totalCost}
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
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>



                {/* Payment Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Channel</label>
                  <select
                    value={paymentData.paymentChannel}
                    onChange={(e) =>
                      handlePaymentChannelChange(
                        e.target.value as "Bank transfer ( manual entry )" | "Payment gateway" | "Cash" | "UPI",
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm mb-4"
                  >
                    <option value="Bank transfer ( manual entry )">Bank transfer (manual entry)</option>
                    <option value="Payment gateway">Payment gateway</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                {/* Conditional details below Payment Channel */}
                {paymentData.paymentChannel === "Bank transfer ( manual entry )" && (
                  <div className="space-y-4 mb-4">
                    {/* Transaction ID */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        Transaction ID
                        <Info className="w-4 h-4 ml-1 text-gray-400" />
                      </label>
                      <input
                        type="text"
                        value={paymentData.transactionId}
                        onChange={(e) => handleInputChange("transactionId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Choose Bank */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700 mb-3">Choose bank account for reference</p>
                      <div className="space-y-2">
                        {(paymentMethods.find((pm) => pm.type === "BANK_ACCOUNT")?.bank || []).map(
                          (bank: { bankName: string; accountNumber: string }, index: number) => (
                            <div key={index} className="flex items-start sm:items-center">
                              <input
                                type="radio"
                                name="bankAccount"
                                checked={paymentData.selectedBank === `${bank.bankName} ( ${bank.accountNumber} )`}
                                onChange={() =>
                                  handleInputChange("selectedBank", `${bank.bankName} ( ${bank.accountNumber} )`)
                                }
                                className="mr-3 mt-0.5 sm:mt-0 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700">
                                {bank.bankName} ( {bank.accountNumber} )
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentData.paymentChannel === "UPI" && (
                  <div className="mb-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        UPI ID
                        <Info className="w-4 h-4 ml-1 text-gray-400" />
                      </label>
                      <input
                        type="text"
                        value={paymentData.upiId || ''}
                        onChange={(e) => handleInputChange("upiId", e.target.value)}
                        placeholder="Enter UPI ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Receipt Upload - Always Visible */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-full px-3 py-2 border border-gray-300 rounded-md">Attach receipts / Screenshots</span>
                    <div className="relative flex-1 max-w-[120px]">
                      <input
                        type="file"
                        id="file-upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <label
                        htmlFor="file-upload"
                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors text-xs font-medium cursor-pointer block text-center whitespace-nowrap"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                  {selectedFile && (
                    <span className="text-xs text-green-600 mt-1 block">Selected: {selectedFile.name}</span>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-medium w-full sm:w-auto"
                  >
                    {isLoading ? "UPDATING..." : "UPDATE"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Payment Summary Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full xl:w-[528px] xl:ml-[-143px] p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Payment History</h3>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid on</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount paid</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment channel</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RECEIPT</th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INVOICE</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-3 text-center text-xs text-gray-400">No payments found.</td>
                      </tr>
                    ) : (
                      payments.map((payment, idx) => (
                        <tr key={payment.id || idx}>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">{payment.transactionId || '-'}</td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">{payment.amountPaid} {payment.enquiry?.currency || currency}</td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">{payment.remainingBalance} {payment.enquiry?.currency || currency}</td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.paymentStatus === 'PAID' ? 'bg-green-500' : payment.paymentStatus === 'PARTIAL' ? 'bg-yellow-500' : 'bg-gray-400'} text-white`}>
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-xs text-gray-900">{payment.paymentChannel}</td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            {payment.receiptFile?.id ? (
                              <button
                                onClick={() => handleDownload({
                                  id: payment.receiptFile!.id,
                                  url: payment.receiptFile!.url,
                                  name: payment.receiptFile!.name || 'receipt'
                                })}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                title={`Download ${payment.receiptFile.name || 'receipt'}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </button>
                            ) : payment.receiptUrl && typeof payment.receiptUrl === 'string' ? (
                              <button
                                onClick={() => handleDownload({
                                  url: payment.receiptUrl!,
                                  name: `receipt_${payment.id}`
                                })}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download receipt"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">No file</span>
                            )}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleInvoiceDownload(payment.id)}
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="block lg:hidden space-y-3">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    No payments found.
                  </div>
                ) : (
                  payments.map((payment, idx) => (
                    <div key={payment.id || idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <div className="text-gray-900">{new Date(payment.paymentDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Transaction ID:</span>
                          <div className="text-gray-900">{payment.transactionId || '-'}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Amount Paid:</span>
                          <div className="text-gray-900">{payment.amountPaid} {payment.enquiry?.currency || currency}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Pending:</span>
                          <div className="text-gray-900">{payment.remainingBalance} {payment.enquiry?.currency || currency}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payment.paymentStatus === 'PAID' ? 'bg-green-500' : payment.paymentStatus === 'PARTIAL' ? 'bg-yellow-500' : 'bg-gray-400'} text-white`}>
                              {payment.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Channel:</span>
                          <div className="text-gray-900 text-xs">{payment.paymentChannel}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium text-gray-700 text-xs">Receipt:</span>
                            <div className="mt-1">
                              {payment.receiptFile?.id ? (
                                <button
                                  onClick={() => handleDownload({
                                    id: payment.receiptFile!.id,
                                    url: payment.receiptFile!.url,
                                    name: payment.receiptFile!.name || 'receipt'
                                  })}
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                  title={`Download ${payment.receiptFile.name || 'receipt'}`}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </button>
                              ) : payment.receiptUrl && typeof payment.receiptUrl === 'string' ? (
                                <button
                                  onClick={() => handleDownload({
                                    url: payment.receiptUrl!,
                                    name: `receipt_${payment.id}`
                                  })}
                                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Download receipt"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Download
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">No file</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 text-xs">Invoice:</span>
                            <div className="mt-1">
                              <button
                                onClick={() => handleInvoiceDownload(payment.id)}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                title="Download Invoice"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DMCPaymentInterface;