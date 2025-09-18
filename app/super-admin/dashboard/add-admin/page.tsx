import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer";
import AdminManagerSection from "./add-admin";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10">
        <TopBarContainer />
      </div>
       <main className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <AdminManagerSection/>
      </main>
      </div>
  )
}

