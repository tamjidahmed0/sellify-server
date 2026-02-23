import { Injectable } from '@nestjs/common';
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


}
