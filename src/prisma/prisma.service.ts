// import { Injectable } from '@nestjs/common';
// import { PrismaClient } from '../../prisma/client/client';
// import { PrismaPg } from '@prisma/adapter-pg';



// @Injectable()
// export class PrismaService extends PrismaClient {
//   constructor() {
//     const adapter = new PrismaPg({
//       connectionString: process.env.DATABASE_URL as string,
//     });
//     super({ adapter });
//   }
// }


import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../prisma/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL as string,
      max: 20,              // ✅ max connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // ✅ connection পাওয়ার timeout
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
}




