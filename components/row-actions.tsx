"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MoreHorizontal, Check, X, Clock } from "lucide-react"

type StatusType = "PENDING" | "APPROVED" | "REJECTED"

type RowActionsProps = {
  id: string
  currentStatus: StatusType
  onStatusUpdate?: (id: string, status: StatusType) => Promise<void>
  side?: "top" | "right" | "bottom" | "left"
}

export function RowActions({ 
  id, 
  currentStatus, 
  onStatusUpdate, 
  side = "right" 
}: RowActionsProps) {
  const [open, setOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleStatusUpdate = async (status: StatusType) => {
    if (!onStatusUpdate) return
    
    try {
      setIsUpdating(true)
      await onStatusUpdate(id, status)
    } finally {
      setIsUpdating(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Row actions"
          disabled={isUpdating}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side={side} className="w-48 p-2">
        <div className="flex flex-col space-y-1">
          {currentStatus !== "APPROVED" && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleStatusUpdate("APPROVED")}
              disabled={isUpdating}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          {currentStatus !== "REJECTED" && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={() => handleStatusUpdate("REJECTED")}
              disabled={isUpdating}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {currentStatus !== "PENDING" && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-amber-600 hover:bg-amber-50"
              onClick={() => handleStatusUpdate("PENDING")}
              disabled={isUpdating}
            >
              <Clock className="mr-2 h-4 w-4" />
              Set as Pending
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
