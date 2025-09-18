import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer";
import ViewLeads from "./view-leads";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10">
        <TopBarContainer />
      </div>
      <main className="min-h-screen p-6 md:p-8 lg:p-10">
        <ViewLeads/>
      </main>
      </div>
  )
}
