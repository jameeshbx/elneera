import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-GB").replace(/\//g, " . ")
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return (
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) + ", Today"
    )
  } else if (diffInHours < 48) {
    return (
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) + ", Yesterday"
    )
  } else {
    return (
      d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      ", " +
      d.toLocaleDateString()
    )
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}
