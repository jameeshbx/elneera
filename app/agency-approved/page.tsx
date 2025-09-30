import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AgencyApprovedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Agency Approved Successfully</h1>
        <p className="text-gray-600">
          The agency has been approved and their account has been activated.
        </p>
        <div className="pt-4">
          <Link
            href="/admin/agencies"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Agencies
          </Link>
        </div>
      </div>
    </div>
  );
}
