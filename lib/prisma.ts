import { PrismaClient } from '@prisma/client'

// This prevents multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with logging in development
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
})

// In development, store the Prisma Client in the global object to avoid hot-reloading issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add a type for the global prisma variable
declare global {
  var prisma: PrismaClient | undefined
}

export default prisma