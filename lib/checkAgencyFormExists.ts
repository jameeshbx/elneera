// Helper to check if agency form exists for the current user
export async function checkAgencyFormExists() {
  try {
    const res = await fetch("/api/agencyform", { method: "GET" })
    if (!res.ok) return false
    const data = await res.json()
    return data.exists === true
  } catch {
    return false
  }
}
