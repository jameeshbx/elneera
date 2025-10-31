import Profile from "@/app/teamlead/dashboard/profile/profile-admin";
import { TopBar } from "../../(components)/AgencyTopbar";

export default function profile() {
  return (
    <div className="relative">
      <div className="w-full z-0 relative">
<TopBar breadcrumbs={[]}/>
      </div>
      <div className="w-[97%] mx-auto -mt-10 rounded-2xl overflow-hidden  relative z-10">
        <Profile />
      </div>
    </div>
  );
}