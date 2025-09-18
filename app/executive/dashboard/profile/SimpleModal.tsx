// Create a new file called SimpleModal.tsx
"use client"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SimpleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function SimpleModal({  onClose, title, children }: SimpleModalProps) {
  

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}


