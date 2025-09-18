import Profile from "./profile-section";
import { TopBarContainer } from "@/app/admin/(components)/TobBarContainer";

export default function profile() {
  return (
    <div className="relative">
      <div className="w-full relative">
        <TopBarContainer />
      </div>
      <div className="w-[97%] mx-auto -mt-10 rounded-2xl overflow-hidden  relative">
        <Profile />
      </div>
    </div>
  );
}