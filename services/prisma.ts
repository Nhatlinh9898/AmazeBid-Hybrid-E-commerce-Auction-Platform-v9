import { PrismaClient } from '@prisma/client';

// Khởi tạo Prisma Client để kết nối với PostgreSQL
// Trong môi trường development, chúng ta sử dụng global variable để tránh tạo quá nhiều connection
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
