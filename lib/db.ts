import { PrismaClient } from "@prisma/client";

declare global {
  // Biarkan global prisma untuk development
  // supaya tidak bikin koneksi baru setiap HMR (Hot Module Replacement)
  
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // lebih detail log
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}