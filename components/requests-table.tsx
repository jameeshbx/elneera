"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { RowActions } from "./row-actions"

export type RequestRow = {
  rawId: string
  id: string
  name: string
  phone: string
  email: string
  company: string
  status: "Pending" | "Active" | "Rejected"
  requestedOn?: string
  managedBy?: string
}

type RequestsTableProps = {
  title: string
  buttonText: string
  rows?: RequestRow[]
  onStatusUpdate?: (id: string, status: "PENDING" | "APPROVED" | "REJECTED") => Promise<void>
}

export function RequestsTable({
  title,
  buttonText,
  rows = [],
  onStatusUpdate
}: RequestsTableProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" className="rounded-full h-8 px-3 bg-[#ECEDEE] hover:bg-[#ECEDEE] text-dark border-none">
          {buttonText}
        </Button>
      </div>
      <Card className="rounded-2xl overflow-hidden border-none">
        <div className="overflow-x-auto scrollbar-card">
          <Table className="text-sm  [&_th]:py-2 [&_td]:py-2 [&_th]:px-3 [&_td]:px-3 [&_th]:text-sm">
            
              
            
            <TableBody className="font-poppins">
            <TableRow>
                <TableHead className="min-w-[110px] font-semibold text-[#6B6F7B]">REQUEST ID</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-[#6B6F7B]">NAME</TableHead>
                <TableHead className="min-w-[100px] font-semibold text-[#6B6F7B]">PHONE NO.</TableHead>
                <TableHead className="min-w-[180px] font-semibold text-[#6B6F7B]">EMAIL</TableHead>
                <TableHead className="min-w-[130px] font-semibold text-[#6B6F7B]">COMPANY</TableHead>
                <TableHead className="min-w-[60px] font-semibold text-[#6B6F7B]">STATUS</TableHead>
                <TableHead />
              </TableRow>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.phone}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href="#" className="underline underline-offset-2">
                      {row.email}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.company}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`border-0 ${
                        row.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : row.status === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-[#FEF9C3] text-amber-700'
                      }`}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions 
                      id={row.rawId} 
                      currentStatus={(row.status === 'Active' ? 'APPROVED' : row.status.toUpperCase()) as "PENDING" | "APPROVED" | "REJECTED"}
                      onStatusUpdate={onStatusUpdate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption className="sr-only">{title}</TableCaption>
          </Table>
        </div>
      </Card>
    </>
  )
}
