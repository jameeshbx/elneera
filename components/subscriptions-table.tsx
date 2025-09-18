"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { RowActions } from "./row-actions"

export type SubRow = {
  id: string
  name: string
  email: string
  company: string
  status: "Active" | "Inactive"
  requestedOn?: string
  managedBy?: string
}

function StatusPill({ status }: { status: "Active" | "Inactive" }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#183F30] text-white px-3 py-1 text-xs font-medium shadow-sm">
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md bg-[#E4E7EB] text-slate-700 px-3 py-1 text-xs font-medium">
      Inactive
    </span>
  )
}

export function SubscriptionsTable({
  title,
  buttonText,
  rows = [],
}: { title: string; buttonText: string; rows?: SubRow[] }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 pb-6">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" className="rounded-full h-8 px-3 bg-[#ECEDEE] hover:bg-[#ECEDEE] text-dark border-none">
          {buttonText}
        </Button>
      </div>
      <Card className="rounded-2xl overflow-hidden border-none">
        <div className="overflow-x-auto scrollbar-card">
          <Table className="text-sm [&_th]:py-2 [&_td]:py-2 [&_th]:px-3 [&_td]:px-3 [&_th]:text-sm">
           
            <TableBody>
            
              <TableRow>
                <TableHead className="min-w-[80px] font-semibold  text-[#6B6F7B]">SUB ID</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-[#6B6F7B]">NAME</TableHead>
                <TableHead className="min-w-[180px] font-semibold text-[#6B6F7B]">EMAIL</TableHead>
                <TableHead className="min-w-[120px] font-semibold text-[#6B6F7B]">COMPANY</TableHead>
                <TableHead className="min-w-[80px] font-semibold text-[#6B6F7B]">STATUS</TableHead>
                <TableHead className="w/[1%]" />
              </TableRow>
            
              {rows.map((r, i) => (
                <TableRow key={`${r.id}-${i}`}>
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href="#" className="underline underline-offset-2">
                      {r.email}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.company}</TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions 
                      id={r.id} 
                      currentStatus="PENDING" 
                      onStatusUpdate={async (id, status) => {
                        // TODO: Implement status update logic
                        console.log(`Updating status for ${id} to ${status}`);
                      }} 
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
