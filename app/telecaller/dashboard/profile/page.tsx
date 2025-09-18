
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer";
import ProfilePage from "@/app/telecaller/dashboard/profile/profile-admin";

export default function profile() {
  return (
    <div className="relative">
      <div className="w-full z-0 relative">
        <TopBarContainer />
      </div>
      <div className="w-[97%] mx-auto -mt-10 rounded-2xl overflow-hidden  relative z-10">
        <ProfilePage/>
      </div>
    </div>
  );
}