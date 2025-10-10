import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, UserType, UserStatus } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

checkDatabaseConnection().catch(console.error);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(JSON.stringify({
            error: 'MissingCredentials',
            message: 'Email and password are required'
          }));
        }

        try {
          const { email, password } = loginSchema.parse(credentials);
          const normalizedEmail = email.toLowerCase().trim();

          const isDbConnected = await checkDatabaseConnection();
          if (!isDbConnected) {
            throw new Error(JSON.stringify({
              error: 'DatabaseError',
              message: 'Unable to connect to the database. Please try again later.'
            }));
          }

          // Try main user table first
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              agencyForms: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          });

          // Try user_form table if not found
          let userFormUser = null;
          if (!user) {
            userFormUser = await prisma.userForm.findUnique({
              where: { email: normalizedEmail }
            });
          }

          if (!user && !userFormUser) {
            throw new Error(JSON.stringify({
              error: 'UserNotFound',
              message: 'No account found with this email address.'
            }));
          }

          // Handle user_form table users
          if (userFormUser) {
            if (userFormUser.status !== 'ACTIVE') {
              throw new Error(JSON.stringify({
                error: 'AccountInactive',
                message: 'Your account is not active. Please contact support.'
              }));
            }

            const isValid = await bcrypt.compare(password, userFormUser.password);
            if (!isValid) {
              throw new Error(JSON.stringify({
                error: 'InvalidPassword',
                message: 'The password you entered is incorrect.'
              }));
            }

            return {
              id: userFormUser.id,
              email: userFormUser.email ?? null,
              name: userFormUser.name ?? null,
              role: "EXECUTIVE" as Role,
              userType: userFormUser.userType as UserType,
              agencyId: null,
              agencyFormSubmitted: true,
              isActive: true,
              agencyFormStatus: null,
              profileCompleted: true,
              status: userFormUser.status as UserStatus
            };
          }

          // Handle main user table
          if (user) {
            if (!user.password) {
              throw new Error(JSON.stringify({
                error: 'NoPasswordSet',
                message: 'Account not properly configured. Please contact support.'
              }));
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
              throw new Error(JSON.stringify({
                error: 'InvalidPassword',
                message: 'The password you entered is incorrect.'
              }));
            }

            const agencyFormStatus = user.agencyForms[0]?.status || null;

            return {
              id: user.id,
              email: user.email ?? null,
              name: user.name ?? null,
              role: user.role as Role,
              userType: user.userType as UserType,
              agencyId: user.agencyId,
              agencyFormStatus,
              profileCompleted: user.profileCompleted,
              status: user.status as UserStatus,
              agencyFormSubmitted: !!user.agencyForms[0],
              isActive: user.isOnline
            };
          }

          throw new Error('User authentication failed');
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message || 'Authentication failed. Please try again.');
          }
          throw new Error('An unexpected error occurred during authentication');
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.userType = user.userType;
        token.agencyId = user.agencyId;
        token.agencyFormStatus = user.agencyFormStatus;
        token.agencyFormSubmitted = user.agencyFormSubmitted;
        token.isActive = user.isActive;
        token.profileCompleted = user.profileCompleted;
        token.status = user.status;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
        session.user.role = token.role as Role;
        session.user.userType = token.userType as UserType;
        session.user.agencyId = token.agencyId as string | null;
        session.user.agencyFormStatus = token.agencyFormStatus as string | null;
        session.user.agencyFormSubmitted = token.agencyFormSubmitted as boolean;
        session.user.isActive = token.isActive as boolean;
        session.user.profileCompleted = token.profileCompleted as boolean;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
    
    async signIn({ user }) {
      return user.isActive !== false;
    },
    
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};