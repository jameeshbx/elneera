
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer"
import ManageAgencySignup from "./manage-agency"

export default function ManageAgencyPage() {
  return (
    <div className=" min-h-screen">
      <TopBarContainer/>
      <ManageAgencySignup />
    </div>
  )
}
