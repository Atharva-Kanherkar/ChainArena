import { PrismaClient } from '@prisma/client';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Create Prisma client with proper error handling
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Prisma client initialization failed:', (error as any)?.message || error);
  
  if (isDevelopment) {
    console.warn('🔧 Using mock Prisma client for development');
    console.warn('   To use the real database:');
    console.warn('   1. Set DATABASE_URL in your .env file');
    console.warn('   2. Run: npx prisma generate');
    console.warn('   3. Run: npx prisma db push (for development)');
    
    // Create a development-friendly mock that provides useful feedback
    const createMockMethods = () => ({
      findUnique: async (args?: any) => {
        console.debug('🔧 Mock Prisma findUnique:', args?.where);
        return null;
      },
      findMany: async (args?: any) => {
        console.debug('🔧 Mock Prisma findMany');
        return [];
      },
      findFirst: async (args?: any) => {
        console.debug('🔧 Mock Prisma findFirst:', args?.where);
        return null;
      },
      create: async (args: any) => {
        console.debug('🔧 Mock Prisma create:', args?.data);
        return { 
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args?.data 
        };
      },
      update: async (args: any) => {
        console.debug('🔧 Mock Prisma update:', args?.where, args?.data);
        return { 
          id: args?.where?.id || 'mock-id',
          updatedAt: new Date(),
          ...args?.data 
        };
      },
      upsert: async (args: any) => {
        console.debug('🔧 Mock Prisma upsert');
        return { 
          id: `mock-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args?.create 
        };
      },
      delete: async (args: any) => {
        console.debug('🔧 Mock Prisma delete:', args?.where);
        return { id: args?.where?.id || 'mock-id' };
      },
      deleteMany: async (args: any) => {
        console.debug('🔧 Mock Prisma deleteMany:', args);
        return { count: 0 };
      },
      count: async () => 0,
      groupBy: async () => [],
    });

    prisma = {
      user: createMockMethods(),
      tournament: createMockMethods(),
      team: createMockMethods(),
      tournamentParticipant: createMockMethods(),
      match: createMockMethods(),
      tournamentPrize: createMockMethods(),
      prizePayment: createMockMethods(),
      achievement: createMockMethods(),
      tournamentAnnouncement: createMockMethods(),
      $transaction: async (fn: any) => {
        console.debug('🔄 Mock Prisma transaction executed');
        return await fn(prisma);
      },
      $connect: async () => {
        console.debug('🔗 Mock Prisma connect');
      },
      $disconnect: async () => {
        console.debug('🔌 Mock Prisma disconnect');
      },
    } as any;
  } else {
    // In production, don't continue without a working database
    throw new Error('Database connection required in production. Please ensure Prisma client is properly configured.');
  }
}

export default prisma;

// Export a flag to check if we're using mock data
export const isMockMode = !process.env.DATABASE_URL || process.env.NODE_ENV === 'development';