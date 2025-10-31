import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { Role, UserType } from "@prisma/client"
import { User as NextAuthUser } from "next-auth";




type AuthUser = NextAuthUser & {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  userType: UserType;
  agencyId: string | null;
  agencyFormStatus: string | null;
  profileCompleted: boolean;
  status: string;
};
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
   async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const normalizedEmail = credentials.email.trim().toLowerCase()

        // Try main user table first
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            agencyForms: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })

        if (user) {
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          const agencyFormStatus = user.agencyForms[0]?.status || null
          return ({
            id: user.id,
            email: user.email,
            name: user.name,
           role: user.role as Role,  // Cast to Role enum
            userType: user.userType,
            agencyId: user.agencyId,
            agencyFormStatus,
            profileCompleted: user.profileCompleted,
            status: user.status,
          } as AuthUser)
        }

        // Fallback: check user_form table (agency-created users)
        const userFormUser = await prisma.userForm.findUnique({ where: { email: normalizedEmail } })
        if (userFormUser) {
          if (userFormUser.status !== 'ACTIVE') {
            throw new Error('Your account is not active. Please contact support.')
          }

          const isValid = await bcrypt.compare(credentials.password, userFormUser.password)
          if (!isValid) {
            throw new Error('Invalid email or password')
          }

          // Map userForm into the shape we store in the token/session
          return ({
            id: userFormUser.id,
            email: userFormUser.email,
            name: userFormUser.name,
            role: 'EXECUTIVE',
            userType: userFormUser.userType,
            agencyId: userFormUser.agencyId || null,
            profileCompleted: true,
            status: userFormUser.status,
          } as AuthUser)
        }

        throw new Error('Invalid email or password')
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.userType = user.userType
        token.agencyId = user.agencyId
        token.agencyFormStatus = user.agencyFormStatus
        token.profileCompleted = user.profileCompleted
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.userType = token.userType as UserType
        session.user.agencyId = token.agencyId
        session.user.agencyFormStatus = token.agencyFormStatus
        session.user.profileCompleted = token.profileCompleted
        session.user.status = token.status
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }