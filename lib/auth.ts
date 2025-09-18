import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UserRole, UserType } from "@/types/next-auth";



// Map Prisma Role to UserRole
type PrismaUser = User & {
  role: string;
  userType: string;
};

// Extend for user_form table
type UserFormUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  userType: string;
  phoneNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

// Extend the User type to include custom fields
type ExtendedUser = PrismaUser & {
  isActive?: boolean;
  agency?: ({
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    config: Record<string, unknown>;
    createdBy: string;
  } & {
    agencyForm?: {
      id: string;
      name: string;
      email?: string | null;
    } | null;
  }) | null;
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
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
  }
}

// Create a single PrismaClient instance to avoid too many connections
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Add database connection check
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

// Verify database connection on startup
checkDatabaseConnection().catch(console.error);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
function mapUserTypeToRole(userType: string): UserRole {
  switch (userType.toUpperCase()) {
    case 'AGENCY_ADMIN':
      return 'AGENT_ADMIN';
    case 'MANAGER':
      return 'MANAGER';
    case 'TEAM_LEAD':
    case 'TL':
      return 'TEAM_LEAD';
    case 'EXECUTIVE':
      return 'EXECUTIVE';
    default:
      return 'EXECUTIVE'; // Default role
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log('🔑 Authorization attempt started');
        if (!credentials?.email || !credentials?.password) {
          console.warn('❌ Missing credentials:', { 
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password 
          });
          throw new Error(JSON.stringify({
            error: 'MissingCredentials',
            message: 'Email and password are required'
          }));
        }
          

          try {
            // Validate credentials format
            const { email, password } = loginSchema.parse(credentials);
            const normalizedEmail = email.toLowerCase().trim();
  
            console.log('🔍 Looking up user with email:', normalizedEmail);
  
            // First verify database connection
            const isDbConnected = await checkDatabaseConnection();
            if (!isDbConnected) {
              console.error('❌ Database connection failed');
              throw new Error(JSON.stringify({
                error: 'DatabaseError',
                message: 'Unable to connect to the database. Please try again later.'
              }));
            }
  
            // Try to find user in main user table first
            let user: ExtendedUser | null = null;
            let userFormUser: UserFormUser | null = null;
            let isFromUserForm = false;

          try {
            // Check if password is in plain text (for development only)
            console.log('🔍 Querying main user table for:', normalizedEmail);
            user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
              include: {
                agency: true
              }
            }) as ExtendedUser | null;            
            // Check if password is hashed
             // If not found in main table, check user_form table
             if (!user) {
              console.log('🔍 User not found in main table, checking user_form table');
              userFormUser = await prisma.userForm.findUnique({
                where: { email: normalizedEmail }
              }) as UserFormUser | null;

              if (userFormUser) {
                console.log('✅ Found user in user_form table:', userFormUser.email);
                isFromUserForm = true;
              }
            }
            
            if (!user && !userFormUser) {
              console.warn('⚠️ No user found with email:', normalizedEmail);
              throw new Error(JSON.stringify({
                error: 'UserNotFound',
                message: 'No account found with this email address. Please check your email or sign up.'
              }));
            }
          } catch (error) {
            console.error('❌ Database error when finding user:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : 'UnknownError'
            });
            
            // If password was in plain text, hash it for security
            // More specific error handling
            const errorMessage = error instanceof Error ? 
              (error.message.includes('prisma') ? 'Database connection error' : error.message) :
              'An unknown error occurred';

            throw new Error(JSON.stringify({
              error: 'DatabaseError',
              message: errorMessage,
              code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
            }));
          }

          // Handle user_form users
          if (isFromUserForm && userFormUser) {
            // Check if user is active
            if (userFormUser.status !== 'ACTIVE') {
              console.warn('🚫 User account is not active:', normalizedEmail);
              throw new Error(JSON.stringify({
                error: 'AccountInactive',
                message: 'Your account is not active. Please contact support.'
              }));
            }

            // Verify password for user_form user
            console.log('🔑 Verifying password for user_form user:', userFormUser.id);
            let isValid = false;
            try {
              isValid = await bcrypt.compare(password, userFormUser.password);
            } catch (bcryptError) {
              console.error('❌ Bcrypt compare error:', bcryptError);
              throw new Error('Error during password verification. Please try again.');
            }

            if (!isValid) {
              console.warn('❌ Invalid password for user_form user:', userFormUser.id);
              throw new Error(JSON.stringify({
                error: 'InvalidPassword',
                message: 'The password you entered is incorrect. Please try again.'
              }));
            }

            console.log('✅ Login successful for user_form user:', {
              id: userFormUser.id,
              email: userFormUser.email,
              userType: userFormUser.userType
            });

            // Map userType to role
            const role = mapUserTypeToRole(userFormUser.userType);

            // Return user object for user_form users
            return {
              id: userFormUser.id,
              email: userFormUser.email,
              name: userFormUser.name,
              role: role,
              userType: userFormUser.userType as UserType,
              agencyId: null, // user_form users don't have agencies
              agencyFormSubmitted: true,
              isActive: true
            };
          }

          // Handle regular users (from main user table)
          if (user) {
            // If user has an agency, check if they have an agency form
            if (user?.agency) {
              const agencyForm = await prisma.agencyForm.findFirst({
                where: { createdBy: user.id },
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              });
  // Add agency form to user object if it exists
  if (agencyForm) {
    user.agency = {
      ...user.agency,
      agencyForm
    };
  }
}

if (!user.password) {
  console.warn('⚠️ User has no password set:', normalizedEmail);
  throw new Error(JSON.stringify({
    error: 'NoPasswordSet',
    message: 'Account not properly configured. Please use the password reset option or contact support.'
  }));
}

console.log('🔑 Verifying password for regular user:', user.id);
let isValid = false;
try {
  isValid = await bcrypt.compare(password, user.password);
} catch (bcryptError) {
  console.error('❌ Bcrypt compare error:', bcryptError);
  throw new Error('Error during password verification. Please try again.');            }
            
            if (!isValid) {
              console.warn('❌ Invalid password for user:', user.id);
              throw new Error(JSON.stringify({
                error: 'InvalidPassword',
                message: 'The password you entered is incorrect. Please try again.'
              }));
            }

            // Default to true if isActive is not set
            const isActive = user.isActive !== false; // Treat undefined as true

            if (!isActive) {
              console.warn('🚫 User account is not active:', normalizedEmail);
              throw new Error(JSON.stringify({
                error: 'AccountInactive',
                message: 'Your account is not active. Please contact support.'
              }));
            }

            // Check if user is AGENT_ADMIN and has submitted agency form
            const isAgentAdmin = user.role === 'AGENT_ADMIN';
            const hasAgencyForm = isAgentAdmin && user.agency?.agencyForm !== null;

            // For AGENT_ADMIN, ensure they have submitted the agency form
            if (isAgentAdmin && !hasAgencyForm) {
              console.log('ℹ️ Agent admin needs to submit agency form');
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as UserRole,
                userType: user.userType as UserType,
                agencyId: user.agencyId,
                agencyFormSubmitted: false,
                isActive: user.isActive
              };
            }

            console.log('✅ Login successful for regular user:', {
              id: user.id,
              email: user.email,
              role: user.role,
              userType: user.userType,
              isAgentAdmin,
              hasAgencyForm: isAgentAdmin ? hasAgencyForm : 'N/A',
              agencyId: user.agencyId
            });

            // For all other users, redirect to their respective dashboards
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role as UserRole,
              userType: user.userType as UserType,
              agencyId: user.agencyId,
              agencyFormSubmitted: true,
              isActive: user.isActive
            };
          }




          throw new Error('User authentication failed');
        } catch (error) {
          if (error instanceof Error) {
            console.error('🔴 Authorization error:', error.message);
            // Rethrow the error with a user-friendly message
            throw new Error(error.message || 'Authentication failed. Please try again.');
          }
          console.error('🔴 Unknown authorization error');
          throw new Error('An unexpected error occurred during authentication');
        }
      },
    }),
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: user.userType,
          agencyId: user.agencyId,
          agencyFormSubmitted: user.agencyFormSubmitted,
          isActive: user.isActive
        };
      }

      // Update token from session if triggered by update
      if (trigger === 'update' && session) {
        return { ...token, ...session.user };
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email,
          name: token.name,
          role: token.role as UserRole,
          userType: token.userType as UserType,
          agencyId: token.agencyId as string | undefined,
          agencyFormSubmitted: token.agencyFormSubmitted as boolean | undefined,
          isActive: token.isActive as boolean | undefined
        };
      }
      return session;
    },
    async signIn({ user }) {
      // Only allow sign in if user is active (or if isActive is not set)
      const isActive = user.isActive !== false; // Treat undefined as true
      if (!isActive) {
        return false; // Reject sign in
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Otherwise redirect to base URL
      return baseUrl;
  
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  
};