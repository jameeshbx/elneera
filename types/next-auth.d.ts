import { DefaultSession } from "next-auth";

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT_USER' | 'AGENT_ADMIN' | 'DMC_USER' | 'DMC_ADMIN' | 'MANAGER' | 'TL' | 'EXECUTIVE' | 'TEAM_LEAD' | 'AGENCY_ADMIN';
export type UserType = 'TREKKING_MYLES' | 'AGENCY' | 'DMC' | 'AGENCY_ADMIN' | 'TEAM_LEAD' | 'EXECUTIVE' | 'MANAGER' | 'TL';

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string | null;
      name: string | null;
      image?: string | null;
      role: UserRole;
      userType: UserType;
      agencyId?: string | null;
      agencyFormSubmitted?: boolean;
      isActive?: boolean;
      profileCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string | null;
    name: string | null;
    role: UserRole;
    userType: UserType;
    agencyId?: string | null;
    agencyFormSubmitted?: boolean;
    isActive?: boolean;
    profileCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string | null;
    name: string | null;
    role: UserRole;
    userType: UserType;
    agencyId?: string | null;
    agencyFormSubmitted?: boolean;
    isActive?: boolean;
    profileCompleted?: boolean;
  }
}
