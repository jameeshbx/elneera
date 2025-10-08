"use client"

import type React from "react"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Simple types for the data we read
type Enquiry = {
  id: string
  name?: string
  email?: string
  phone?: string
  locations?: string
  estimatedDates?: string
  travellers?: string
  tripName?: string
}

interface DMC {
  id: string;
  name: string;
  primaryContact: string;
  phoneNumber: string;
  designation: string;
  email: string;
  status: string;
  primaryCountry: string;
  destinationsCovered: string;
  cities: string;
}

interface DMCItem {
  id: string;
  dmcId: string;
  status: string;
  dmc: DMC;
  lastUpdated: string;
  notes: string;
}


// Utility to get formatted currency value
const formatNumber = (v: string) => v.replace(/[^\d.]/g, "")

interface DmcQuoteFormProps {
  enquiryId: string | null;
  dmcId: string | null;
  onSuccess?: () => void;
}

export default function DmcQuoteForm({ enquiryId, dmcId, onSuccess }: DmcQuoteFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setQuoteSubmittedAt] = useState<string | null>(null);


  const [enquiry, setEnquiry] = useState<Enquiry | null>(null)
 

  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("")
  const [comments, setComments] = useState("")

  const disabled = useMemo(
    () => saving || !price || !currency || !enquiryId || !dmcId,
    [saving, price, currency, enquiryId, dmcId],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching data for:", { enquiryId, dmcId })
    
        if (enquiryId) {
          // Add the public=1 parameter for public access
          const res = await fetch(`/api/enquiries/public?id=${encodeURIComponent(enquiryId)}`)
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to fetch enquiry')
          }
          
          const result = await res.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to load enquiry data')
          }
    
          const newEnquiry = {
            id: enquiryId,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            locations: result.data.locations,
            estimatedDates: result.data.estimatedDates,
            travellers: result.data.numberOfTravellers || result.data.travellerCount,
            tripName: result.data.locations,
          }
          
          if (!cancelled) {
            setEnquiry(newEnquiry)
            setCurrency(result.data.currency || "USD")
          }
          console.log("Enquiry data:", newEnquiry)
        }
      } catch (err) {
        console.error('Error loading enquiry:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load enquiry')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    
    if (enquiryId && dmcId) {
      load()
    }
    
    return () => {
      cancelled = true
    }
  }, [enquiryId, dmcId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !enquiryId || !dmcId) return;
    
    try {
      setSaving(true);
      setError(null);
  
      const quoteData = {
        enquiryId,
        dmcId,
        amount: price, // Will be parsed in the API
        currency,
        comments,
        status: "PENDING", // Default status for new quotes
      };
  
      // 1. First, create the quote in the quotes table
      const quoteResponse = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });
  
      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json();
        throw new Error(errorData.error || "Failed to create quote");
      }
  
      // 2. First, get the shared DMC item ID
      const getItemResponse = await fetch(`/api/share-dmc?enquiryId=${enquiryId}&dmcId=${dmcId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!getItemResponse.ok) {
        const errorData = await getItemResponse.json();
        throw new Error(errorData.error || "Failed to fetch shared DMC item");
      }

      const sharedDMCData = await getItemResponse.json();
      
      // Find the DMC item that matches the dmcId in any of the selectedDMCs arrays
      let selectedDMC = null;
      
      // Loop through all items in the data array
      if (sharedDMCData.data && Array.isArray(sharedDMCData.data)) {
        for (const item of sharedDMCData.data) {
          // Check if this item has selectedDMCs
          if (item.selectedDMCs && Array.isArray(item.selectedDMCs)) {
            // Try to find a matching DMC in this item's selectedDMCs
            const match = item.selectedDMCs.find((dmc: DMCItem) => dmc.dmcId === dmcId);
            if (match) {
              selectedDMC = match;
              break; // Found a match, no need to continue searching
            }
          }
        }
      }

      if (!selectedDMC) {
        console.error('Could not find matching DMC in any of the items:', sharedDMCData);
        throw new Error(`Could not find DMC with ID: ${dmcId} in any of the shared items`);
      }

      const itemId = selectedDMC.id;

      // 3. Then, update the shared_dmcs status to QUOTATION_RECEIVED
      const updateResponse = await fetch("/api/share-dmc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateDMCStatus",
          itemId: itemId,  // Include the itemId here
          status: "QUOTATION_RECEIVED"
        }),
      });
  
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update DMC status");
      }
  
      // Show success message
      toast({
        title: "Success!",
        description: "Quote submitted successfully!",
        variant: "default",
      });
      
      // Update the submission time
      setQuoteSubmittedAt(new Date().toLocaleString());
      
      // Reset form
      setPrice("");
      setCurrency("");
      setComments("");
      
      // Trigger parent component's success handler if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      console.error("Error in form submission:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit quote";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };
  
 
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Brand Section */}
      <div className="bg-[#026451] lg:w-1/2 px-10 pb-6 lg:px-16  flex flex-col pt-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="grid grid-cols-4 gap-2 h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-white rounded-full"></div>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-md pt-16">
          <h1 className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-6">
          Your Expertise Makes This Trip Happen !
          </h1>
          <p className="text-white/90 text-sm mb-8 leading-relaxed">
          We’ve handpicked you for this itinerary. Take a quick look, add your best quote, and let’s make the traveler’s dream trip a reality!
          </p>

        </div>
      </div>

      {/* RIGHT: Quote Form */}
      <div className="lg:w-1/2 bg-gray-50 px-6 md:px-10 lg:px-14 py-10">
        <div className="max-w-xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo/elneeraf.png"
              alt="elneera"
              width={176}
              height={64}
              className="w-[200px] h-auto object-contain"
              priority
            />
          </div>

          <div className="mb-1">
            <h2 className="text-2xl font-bold text-center text-gray-800 text-balance">
              Review Itinerary & Submit Your Quote
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please review the details below and provide your best quote. Your response will help us confirm with the
              agency faster.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-8">
            {/* Itinerary Overview */}
            <section className="space-y-4">
              <h3 className="font-semibold text-gray-800">Itinerary Overview</h3>
              
                  <div>
                <Label htmlFor="tripName" className="text-sm text-gray-600">
                  Trip Name
                </Label>
                <Input id="tripName" value={enquiry?.tripName || ""} readOnly className="mt-1 bg-white text-black" />
                  </div>
                  
                  <div>
                <Label htmlFor="dates" className="text-sm text-gray-600">
                  Dates
                </Label>
                <Input id="dates" value={enquiry?.estimatedDates || ""} readOnly className="mt-1 bg-white text-black" />
                  </div>
                  
                  <div>
                <Label htmlFor="travellers" className="text-sm text-gray-600">
                  Travelers
                </Label>
                <Input id="travellers" value={enquiry?.travellers|| ""} readOnly className="mt-1 bg-white text-black " />
              </div>
            </section>

            {/* Quote Submission */}
            <section className="space-y-4">
              <h3 className="font-semibold text-gray-800">Quote Submission</h3>

              <div>
                <Label htmlFor="totalPrice" className="text-sm text-gray-600">
                  Total Quote Price
                </Label>
                <Input
                  id="totalPrice"
                  inputMode="decimal"
                  placeholder="e.g. 1250"
                  value={price}
                  onChange={(e) => setPrice(formatNumber(e.target.value))}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency" className="text-sm text-gray-600">
                  Currency
                </Label>
                <Input
                  id="currency"
                  placeholder="e.g. USD, EUR, INR"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="comments" className="text-sm text-gray-600">
                  Any additional comments?
                </Label>
                <Textarea
                  id="comments"
                  placeholder="Optional notes about inclusions, exclusions, or validity."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1 min-h-[96px] resize-none"
                />
              </div>
            </section>

            {error && (<Card className="p-3 border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>
  )}
            <Button type="submit" disabled={disabled} className="w-full bg-[#0B6A58] hover:bg-[#0a604f]">
              {saving ? "Submitting..." : "Submit Quote"}
            </Button>
    
    

            {/* Hidden fields for traceability */}
            <input type="hidden" name="enquiryId" value={enquiryId || ""} />
      <input type="hidden" name="dmcId" value={dmcId || ""} />
    </form>

          {/* Loading state */}
          {loading && <p className="mt-6 text-center text-sm text-gray-500">Loading itinerary details…</p>}
        </div>
      </div>
    </div>
  )
}
