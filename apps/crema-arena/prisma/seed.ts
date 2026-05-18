import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@crema-arena.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Check if admin already exists
  const existingAdmin = await prisma.organizer.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✓ Admin user already exists:', adminEmail);
    return;
  }

  // Hash password
  const password_hash = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.organizer.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password_hash,
      role: 'admin',
    },
  });

  console.log('✓ Created admin user:', admin.email);
  console.log('  Email:', adminEmail);
  console.log('  Password:', adminPassword);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
