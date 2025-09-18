import { Suspense } from "react";
import LoginPage from "../login/loginform";

export default function Login() {
   return (
      <div className="">
         <Suspense fallback={<div>Loading...</div>}>
            <LoginPage />
         </Suspense>
      </div>
   );
}