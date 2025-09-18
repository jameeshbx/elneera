import { TopBarContainer } from "../../(components)/TobBarContainer"
import ManageAgencySignup from "./manageagency"

export default function ManageAgencyPage() {
  return (
    <div className=" min-h-screen">
      <TopBarContainer/>
      <ManageAgencySignup />
    </div>
  )
}
