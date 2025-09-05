import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'My Agency',
    },
  })

  console.log(`Created organization: ${org.name} (ID: ${org.id})`)

  const adminRole = await prisma.role.create({
    data: {
      name: UserRole.ADMIN,
    },
  })

  console.log(`Created role: ${adminRole.name}`)

  const user = await prisma.user.create({
    data: {
      email: 'admin@agencyflow.com',
      name: 'Admin User',
      passwordHash: 'password', // In a real app, this should be a proper hash
      organizationId: org.id,
      roleId: adminRole.id,
    },
  })

  console.log(`Created user: ${user.name} (Email: ${user.email})`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
