import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { CATEGORIES } from "../src/lib/constants";

async function main() {
  console.log("Seeding database...");

  // Seed categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        displayOrder: cat.id,
      },
    });
  }

  // Seed settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      commissionRate: 0.07,
      listingFee: 0,
      currency: "KES",
    },
  });

  // Seed admin user
  const adminEmail = "admin@omix.co.ke";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        hashedPassword,
        role: "admin",
        phone: null,
      },
    });
    console.log("✅ Admin user created: admin@omix.co.ke / admin123");
  }

  console.log("✅ Seeding complete");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    prisma.$disconnect();
    process.exit(1);
  });
