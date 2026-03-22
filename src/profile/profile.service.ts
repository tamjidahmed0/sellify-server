import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileService {
    constructor(
        private readonly prisma: PrismaService
    ) { }


    async getProfile(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                picture: true,
                firstName: true
            }
        })

    }




    async getAdminProfile(id: string) {
        const admin = await this.prisma.adminUser.findUnique({
            where:  { id },
            select: { id: true, email: true, role: true, createdAt: true },
        });
        if (!admin) throw new NotFoundException('Admin not found');
        return admin;
    }


     


}
