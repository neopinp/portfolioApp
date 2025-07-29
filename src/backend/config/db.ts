import { PrismaClient } from '@prisma/client';

// Global Prisma Client 
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection pool configuration
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Ensure proper connection management
export const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
}; 