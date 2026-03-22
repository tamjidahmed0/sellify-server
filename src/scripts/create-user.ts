import 'dotenv/config';
import { PrismaClient , Role} from '../../prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const [, , email, password, role] = process.argv;

if (!email || !password || !role) {
  console.error('Usage: npx tsx src/scripts/create-user.ts <email> <password> <role>');
  process.exit(1);
}

async function createUser() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  if (role === 'ADMIN') {
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { role: 'ADMIN' },
    });
    if (existingAdmin) {
      console.log('❌ Admin already exists!');
      await prisma.$disconnect();
      return;
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { email, password: hashedPassword, role: role as Role },
  });

  console.log(`✅ User created: ${user.email} | Role: ${user.role}`);
  await prisma.$disconnect();
}

createUser().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});