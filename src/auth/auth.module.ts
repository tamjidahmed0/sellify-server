import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminAuthService } from './admin.auth.service';
import { AdminAuthController } from './admin.auth.controller';


@Module({
  imports: [PassportModule.register({ session: false }),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: '1d' },
    }),
  }),
    PrismaModule
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [GoogleStrategy, AuthService, JwtStrategy, AdminAuthService],
  exports:[JwtModule]
})
export class AuthModule { }
