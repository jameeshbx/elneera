import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"
import { Role, UserType, UserStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string | null
      name: string | null
      image?: string | null
      role: Role
      userType: UserType
      agencyId?: string | null
      agencyFormStatus?: string | null
      profileCompleted?: boolean
      status?: UserStatus
      agencyFormSubmitted?: boolean
      isActive?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    email: string | null
    name: string | null
    role: Role
    userType: UserType
    agencyId?: string | null
    agencyFormStatus?: string | null
    profileCompleted?: boolean
    status?: UserStatus
    agencyFormSubmitted?: boolean
    isActive?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    role?: Role
    userType?: UserType
    agencyId?: string | null
    agencyFormStatus?: string | null
    profileCompleted?: boolean
    status?: UserStatus
    agencyFormSubmitted?: boolean
    isActive?: boolean
  }
}

export { UserType, Role }
