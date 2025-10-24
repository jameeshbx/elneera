"use client"

import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"


import ActiveUsersChart from "@/components/active-users-chart"
import SalesOverviewChart from "@/components/sales-overview-chart"
import { RequestsTable, type RequestRow } from "@/components/requests-table"

export default function Page() {
  const { data: session } = useSession()

  const [agencyRequests, setAgencyRequests] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    activeRequests: 0,
    rejectedRequests: 0,
  })

  // Function to generate request ID
  const generateRequestId = (id: string, index: number): string => {
    return `AREQ${String(index + 1).padStart(5, "0")}`
  }

  // Function to get manager name (rotating assignment)
  const getManagerName = (index: number): string => {
    const managers = ["Admin Manager", "Agency Manager", "Operations Manager"]
    return managers[index % managers.length]
  }

  // Function to get status from form data
  const getStatus = (status: string | undefined): string => {
    if (!status) return "Pending" // Default to Pending if status is not set
    // Convert to title case for display
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }


  // Fetch agency form data
  useEffect(() => {
    const fetchAgencyRequests = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/agency-request", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(session?.user?.email && { 'X-User-Email': session.user.email })
          },
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            setError("You don't have permission to view agency requests. Please contact an administrator.");
            setAgencyRequests([]);
            return;
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError)
          const responseText = await response.text()
          console.error("Response text:", responseText)
          throw new Error("Invalid JSON response from server")
        }

        // Calculate stats from actual data
        const totalRequests = data.length
        const pendingRequests = data.filter((item: { status?: string }) => 
          !item.status || item.status.toLowerCase() === 'pending'
        ).length
        const activeRequests = data.filter((item: { status?: string }) => 
          item.status?.toLowerCase() === 'active'
        ).length
        const rejectedRequests = data.filter((item: { status?: string }) => 
          item.status?.toLowerCase() === 'rejected'
        ).length

        setStats({
          totalRequests,
          pendingRequests,
          activeRequests,
          rejectedRequests,
        })

        // Transform agency form data to RequestRow format
        const transformedData: RequestRow[] = data.map(
          (
            form: {
              id: string
              companyName: string
              contactPerson: string
              name: string // Company name from the form
              phoneCountryCode: string
              phoneNumber: string
              email: string
              status: string
              companyPhone?: string
              companyPhoneCode?: string
              createdAt: string
              ownerName?: string
            },
            index: number,
          ) => ({
            id: generateRequestId(form.id, index),
            rawId: form.id,
            name: form.contactPerson || form.ownerName || "N/A",
            phone: form.companyPhone
              ? `${form.companyPhoneCode || ""} ${form.companyPhone}`.trim()
              : `${form.phoneCountryCode || ""} ${form.phoneNumber || ""}`.trim(),
            email: form.email,
            company: form.companyName,
            status: getStatus(form.status),
            requestedOn: new Date(form.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            managedBy: getManagerName(index),
          }),
        )

        setAgencyRequests(transformedData)
      } catch (error) {
        console.error("Error fetching agency requests:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch agency requests")
      } finally {
        setLoading(false)
      }
    }

    fetchAgencyRequests()
  }, [])

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <main className="mx-auto max-w-7xl p-2 md:p-2 lg:p-2 space-y-6">
        {/* Top metrics */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-xl p-4 border-none">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription className="font-semibold font-Helvetica text-[#6F7175]">
                  Total Requests
                </CardDescription>
                <CardTitle className="text-xl mt-1 flex items-center gap-2">
                  {stats.totalRequests}
                  <span className="text-emerald-600 text-sm font-medium inline-flex items-center gap-1">
                    {stats.totalRequests > 0 ? "+" : ""}
                  </span>
                </CardTitle>
              </div>
              <div className="size-10 rounded-lg bg-[#183F30] text-emerald-700 flex items-center justify-center">
                <Image src="/dashboard/sublogo.svg" alt="Requests" width={20} height={20} />
              </div>
            </div>
          </Card>

          <Card className="rounded-xl p-4 border-none">
            <div className="flex items-start justify-between">
              <div>
                <CardDescription className="font-semibold font-Helvetica text-[#6F7175]">
                  Pending Requests
                </CardDescription>
                <CardTitle className="text-xl mt-1 flex items-center gap-2">
                  {stats.pendingRequests}
                  <span className="text-orange-600 text-sm font-medium inline-flex items-center gap-1">Pending</span>
                </CardTitle>
              </div>
              <div className="size-10 rounded-lg bg-[#183F30] text-emerald-700 flex items-center justify-center">
                <Image src="/dashboard/userlogo.svg" alt="Pending" width={20} height={20} />
              </div>
            </div>
          </Card>

          {/* Approval Rate wide pill card */}
          <Card className="rounded-xl px-4 py-2 border-none bg-[var(--dark-blue)]">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground text-[#B8C0CC] font-semibold font-Helvetica">
                Approval Rate
              </div>
              <div className="size-6 rounded-lg bg-[#243B53] flex items-center justify-center">
                <Image src="/dashboard/graphlogo.svg" alt="Approval" width={15} height={15} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xl font-semibold text-white">
                {stats.totalRequests > 0 ? Math.round((stats.activeRequests / stats.totalRequests) * 100) : 0}%
              </div>
              <Badge variant="secondary" className="bg-[#D2FFE6] text-emerald-700 hover:bg-emerald-50">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                {stats.activeRequests} Active
              </Badge>
              <span className="ml-auto mt-2 text-xs text-muted-foreground text-[#B8C0CC]">
                {stats.rejectedRequests} Rejected
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-[#627D98]">
              <div
                className="h-1 rounded-full bg-[#00C7F2]"
                style={{
                  width: `${stats.totalRequests > 0 ? (stats.activeRequests / stats.totalRequests) * 100 : 0}%`,
                }}
                aria-label="active progress"
              />
            </div>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-4 md:gap-6">
          {/* Active Users Card */}
          <Card className="rounded-2xl overflow-hidden border-none">
            <CardContent className="p-0">
              <div className="p-2">
                <div className="rounded-xl bg-gradient-to-br from-[#0b1027] to-[#1b2a57] text-white p-4 sm:p-6">
                  <div className="h-[160px] sm:h-[160px]">
                    <ActiveUsersChart />
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-4 px-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold font-Helvetica">Agency Requests</div>
                      <div className="text-xs text-[#6F7175] inline-flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">(+{stats.activeRequests})</span> active
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 py-2 text-sm mt-4">
                    <div className="flex l items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="size-10 rounded-lg bg-[#183F30] text-emerald-700 flex items-center justify-center">
                          <Image src="/dashboard/default.svg" alt="Total" width={20} height={20} />
                        </div>
                        <div className="font-semibold">{stats.totalRequests}</div>
                      </div>
                      <div className="pb-6">
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                    <div className="flex l items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="size-10 rounded-lg bg-[#183F30] text-emerald-700 flex items-center justify-center">
                          <Image src="/dashboard/sharp.svg" alt="Approved" width={20} height={20} />
                        </div>
                        <div className="font-semibold">{stats.activeRequests}</div>
                      </div>
                      <div className="pb-6">
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                    </div>
                    <div className="flex l items-center gap-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="size-10 rounded-lg bg-[#183F30] text-emerald-700 flex items-center justify-center">
                          <Image src="/dashboard/sales.svg" alt="Pending" width={20} height={20} />
                        </div>
                        <div className="font-semibold">{stats.pendingRequests}</div>
                      </div>
                      <div className="pb-6">
                        <div className="text-xs text-muted-foreground">Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Overview */}
          <Card className="rounded-2xl border-none">
            <div className="flex items-start justify-between p-4 px-6">
              <div>
                <CardTitle>Agency Overview</CardTitle>
                <CardDescription className="inline-flex text-[#6F7175] items-center gap-1 mt-1">
                  <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">({"+"}5) more</span>
                  in 2025
                </CardDescription>
              </div>
            </div>

            <div className="h-[240px] sm:h-[280px] lg:h-[240px] mt-4">
              <SalesOverviewChart />
            </div>
          </Card>
        </div>

        {/* Agency Requests Table - Full Width */}
        <div className="w-full">
          {loading ? (
            <Card className="rounded-2xl border-none p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                <div className="text-lg font-medium">Loading agency requests...</div>
              </div>
            </Card>
          ) : error ? (
            <Card className="rounded-2xl border-none p-8">
              <div className="flex items-center justify-center text-red-600">
                <div className="text-lg font-medium">Error: {error}</div>
              </div>
            </Card>
          ) : agencyRequests.length === 0 ? (
            <Card className="rounded-2xl border-none p-8">
              <div className="flex items-center justify-center text-gray-500">
                <div className="text-lg font-medium">No agency requests found</div>
              </div>
            </Card>
          ) : (
            <RequestsTable title="Agency Requests" buttonText="See more" rows={agencyRequests} />
          )}
        </div>

        <footer className="py-6 text-xs text-muted-foreground">@ 2025, Made by Trekking Miles.</footer>
      </main>
    </div>
  )
}
