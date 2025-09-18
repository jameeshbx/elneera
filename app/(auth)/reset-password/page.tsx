import { Suspense } from "react"
import ResetPasswordForm from "./reset-password-form"

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
