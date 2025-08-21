import { PrismaClient } from '@prisma/client';

// Create Prisma client with graceful fallback for development
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.warn('⚠️  Prisma client initialization failed, using mock client for development:', (error as any)?.message || error);
  
  // Create a mock Prisma client for development that matches the type definitions
  const createMockMethods = () => ({
    findUnique: async (args?: any) => {
      console.log('🔧 Mock findUnique called with:', args?.where);
      return null;
    },
    findMany: async (args?: any) => {
      console.log('🔧 Mock findMany called');
      return [];
    },
    findFirst: async (args?: any) => {
      console.log('🔧 Mock findFirst called with:', args?.where);
      return null;
    },
    create: async (args: any) => {
      console.log('🔧 Mock create called with:', args?.data);
      return { id: 'mock-id-' + Date.now(), ...args?.data };
    },
    update: async (args: any) => {
      console.log('🔧 Mock update called with:', args?.where, args?.data);
      return { id: args?.where?.id || 'mock-id', ...args?.data };
    },
    upsert: async (args: any) => {
      console.log('🔧 Mock upsert called');
      return { id: 'mock-id-' + Date.now(), ...args?.create };
    },
    delete: async (args: any) => {
      console.log('🔧 Mock delete called with:', args?.where);
      return { id: args?.where?.id || 'mock-id' };
    },
    deleteMany: async (args: any) => {
      console.log('🔧 Mock deleteMany called with:', args);
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
      console.log('🔄 Mock transaction executed');
      return await fn(prisma);
    },
    $connect: async () => {
      console.log('🔗 Mock Prisma connect');
    },
    $disconnect: async () => {
      console.log('🔌 Mock Prisma disconnect');
    },
  } as any;
}

export default prisma;