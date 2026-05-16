import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Create User Types
  const types = ['Admin', 'Teacher', 'Staff', 'Student']
  for (const title of types) {
    await prisma.userType.upsert({
      where: { title },
      update: {},
      create: { title },
    })
  }

  console.log('User types created.')

  // 2. Create Admin User
  const adminType = await prisma.userType.findUnique({ where: { title: 'Admin' } })
  const hashedPassword = await bcrypt.hash('admin123', 10)

  if (adminType) {
    await prisma.user.upsert({
      where: { email: 'admin@cchs.edu' },
      update: {
        password: hashedPassword,
        active: true,
      },
      create: {
        name: 'System Administrator',
        email: 'admin@cchs.edu',
        password: hashedPassword,
        userTypeId: adminType.id,
        active: true,
      },
    })
    console.log('Admin user created: admin@cchs.edu / admin123')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
