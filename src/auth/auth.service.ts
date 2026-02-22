import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) { }

  async validateOAuthUser(oauthUser: any) {
    const { email, firstName, lastName, picture } = oauthUser;

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // If not, create user 
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          picture,
          provider: 'google',
        },
      });
    }

    return user;
  }



  async verifyToken(token: string) {
    // Implement token verification logic here (using JWT)
    try {
      const decoded = this.jwtService.verify(token);

      let user = await this.prisma.user.findUnique({
        where: { email: decoded.email },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }



      return {
        userId: decoded.userId,
        email: decoded.email,
        name: `${user.firstName} ${user.lastName}`,
      }



    } catch (error) {
      throw new BadRequestException('invalid token');
    }


  }



}
