"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#161616",
            color: "#f0ece4",
            border: "1px solid #2a2a2a",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            letterSpacing: "0.02em",
          },
          success: { iconTheme: { primary: "#c9a84c", secondary: "#0a0a0a" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#0a0a0a" } },
        }}
      />
      {children}
    </SessionProvider>
  )
}
