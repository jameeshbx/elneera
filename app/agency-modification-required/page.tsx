import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"

export default function AgencyModificationRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Edit className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Modification Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your agency registration requires some updates before it can be approved. 
            Please review the information and make the necessary changes.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Please check the following:</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul role="list" className="list-disc space-y-1 pl-5">
                    <li>Business information accuracy</li>
                    <li>Contact details</li>
                    <li>Documentation</li>
                    <li>Any additional requirements mentioned in the email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/agency-admin/agency-form" className="w-full">
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                <Edit className="mr-2 h-4 w-4" />
                Update Agency Details
              </Button>
            </Link>
            
            <p className="mt-3 text-center text-sm text-gray-600">
              Need help?{' '}
              <a href="mailto:support@elneera.com" className="font-medium text-yellow-600 hover:text-yellow-500">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
