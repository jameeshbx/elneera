import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
