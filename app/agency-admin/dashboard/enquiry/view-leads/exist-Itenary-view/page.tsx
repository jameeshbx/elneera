import { TopBar } from "@/app/agency-admin/(components)/AgencyTopbar";
import ExistingItinerary from "@/app/agency-admin/dashboard/enquiry/view-leads/exist-Itenary-view/exist-itenary";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10">
<TopBar breadcrumbs={[]} title="Existing Itinerary" />
      </div>
      <main className="min-h-screen p-6 md:p-8 lg:p-10">
        <ExistingItinerary/>
      </main>
      </div>
  )
}
