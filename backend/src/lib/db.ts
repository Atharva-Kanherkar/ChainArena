import { PrismaClient } from '@prisma/client';

// Add connection retry logic
const prisma = new PrismaClient();

export default prisma;