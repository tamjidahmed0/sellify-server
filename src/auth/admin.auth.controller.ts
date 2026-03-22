import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin.auth.service';



@Controller('admin/auth')
export class AdminAuthController {

    constructor(
        private readonly adminAuthService: AdminAuthService,

    ) { }


    @Post('login')
    async login(@Body() dto) {
        return this.adminAuthService.login(dto)
    }


    @Post('verify')
    verifyToken(@Body('token') token: string) {
        return this.adminAuthService.verifyToken(token);
    }





}
