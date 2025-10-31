export default function LoadingComponent() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-poppins flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
        <div className="text-lg font-medium text-gray-700">Loading enquiry data...</div>
        <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your information</div>
      </div>
    </div>
  )
}
