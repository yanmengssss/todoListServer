import { PrismaClient } from "../prisma-mysql-client";
// npx prisma db push --schema=./prisma-mysql/schema.prisma
// npx prisma generate --schema=./prisma-mysql/schema.prisma
const globalForPrisma = global as unknown as { prismaMySQL?: PrismaClient };

export const prisma =
    globalForPrisma.prismaMySQL ||
    new PrismaClient({
        log: ["query", "error", "warn"], // 可选：调试时查看 SQL
    });
globalForPrisma.prismaMySQL = prisma;
