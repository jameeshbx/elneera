
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer"
import ManageAgencySignup from "./manageagency"

export default function ManageAgencyPage() {
  return (
    <div className=" min-h-screen">
      <TopBarContainer/>
      <ManageAgencySignup />
    </div>
  )
}
