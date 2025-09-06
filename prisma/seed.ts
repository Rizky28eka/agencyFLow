import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create roles if they don't exist
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });
  await prisma.role.upsert({
    where: { name: 'PROJECT_MANAGER' },
    update: {},
    create: { name: 'PROJECT_MANAGER' },
  });
  await prisma.role.upsert({
    where: { name: 'MEMBER' },
    update: {},
    create: { name: 'MEMBER' },
  });
  await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT' },
  });

  // Create a default organization if it doesn't exist
  const defaultOrganization = await prisma.organization.upsert({
    where: { id: 'cmf6tttw10000t46efkctz384' }, // Use the hardcoded ID from addProject
    update: {},
    create: {
      id: 'cmf6tttw10000t46efkctz384',
      name: 'Default Agency',
    },
  });

  // Create 3 admin users for the default organization
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('password123', 10);
  const hashedPassword3 = await bcrypt.hash('password123', 10);

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@agencyflow.com' },
    update: {},
    create: {
      email: 'admin1@agencyflow.com',
      name: 'Admin One',
      passwordHash: hashedPassword1,
      roleId: adminRole.id,
      organizationId: defaultOrganization.id,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@agencyflow.com' },
    update: {},
    create: {
      email: 'admin2@agencyflow.com',
      name: 'Admin Two',
      passwordHash: hashedPassword2,
      roleId: adminRole.id,
      organizationId: defaultOrganization.id,
    },
  });

  const admin3 = await prisma.user.upsert({
    where: { email: 'admin3@agencyflow.com' },
    update: {},
    create: {
      email: 'admin3@agencyflow.com',
      name: 'Admin Three',
      passwordHash: hashedPassword3,
      roleId: adminRole.id,
      organizationId: defaultOrganization.id,
    },
  });

  console.log({ admin1, admin2, admin3 });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });