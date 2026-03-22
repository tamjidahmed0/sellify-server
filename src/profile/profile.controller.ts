import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';




@Controller('profile')
export class ProfileController {
    constructor(private readonly profile: ProfileService) { }



    @Get()
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req) {

        return this.profile.getProfile(req.user.id);

    }




    // GET /admin/profile — logged in 
    @Get('admin')
    @UseGuards(AdminJwtAuthGuard)
    getAdminProfile(@Req() req) {
        return this.profile.getAdminProfile(req.user.id);
    }



}
