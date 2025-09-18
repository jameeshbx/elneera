import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};


const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Ensure the prisma client is properly terminated when the Node.js process ends
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

declare global {
  var prisma: PrismaClient | undefined
}

export default prisma

