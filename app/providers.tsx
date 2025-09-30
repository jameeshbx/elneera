"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { ColorProvider } from "@/context/color-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ColorProvider>
                {children}
                <Toaster />
            </ColorProvider>
        </SessionProvider>
    )
}