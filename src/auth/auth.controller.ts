import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }


    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // redirect google 

    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res) {
        const user = req.user;

        //  DB check or create user
        const dbUser = await this.authService.validateOAuthUser(user);

        // Generate JWT
        const token = this.jwtService.sign({
            userId: dbUser.id,
            email: dbUser.email,
        });

        // Send to frontend
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    }


    @Post('verify')
    verifyToken(@Body('token') token: string) {
        return this.authService.verifyToken(token);
    }


}
