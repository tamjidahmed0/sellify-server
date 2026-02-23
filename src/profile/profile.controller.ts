import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';



@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
    constructor(private readonly profile: ProfileService) { }



    @Get()
    async getProfile(@Req() req) {

        return this.profile.getProfile(req.user.id);

    }



}
