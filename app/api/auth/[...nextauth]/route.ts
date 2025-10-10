import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            agencyForms: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        const agencyFormStatus = user.agencyForms[0]?.status || null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: user.userType,
          agencyId: user.agencyId,
          agencyFormStatus,
          profileCompleted: user.profileCompleted,
          status: user.status,
        }
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
        session.user.role = token.role || 'USER'
        session.user.userType = token.userType || 'CUSTOMER'
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