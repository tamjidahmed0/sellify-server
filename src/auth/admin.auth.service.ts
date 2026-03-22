import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }


    async login(dto) {

        const user = await this.prisma.adminUser.findUnique({
            where: {
                email: dto.email
            }
        })


        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('Invalid credentials');
        }

        const token = this.jwtService.sign({
            id: user.id,
        }, { expiresIn: '2h', secret: process.env.ADMIN_JWT_SECRET });

        return { access_token: token };
    }



    async verifyToken(token: string) {
        // Implement token verification logic here (using JWT)
        try {
            const decoded = this.jwtService.verify(token, {secret: process.env.ADMIN_JWT_SECRET,});

            let user = await this.prisma.adminUser.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                throw new BadRequestException('User not found');
            }

            return {
                id: user.id
            }



        } catch (error) {
            throw new BadRequestException('invalid token');
        }


    }


}





