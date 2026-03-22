import { Controller, Post, Get, Req, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';





@Controller('user-address')
@UseGuards(JwtAuthGuard)
export class UserAddressController {

    constructor(private readonly service: UserAddressService) { }


    // GET /user/address
    @Get()
    getAddresses(@Req() req: any) {
        return this.service.getAddresses(req.user.id);
    }

    // POST /user/address
    @Post()
    saveAddress(@Req() req: any, @Body() dto) {
        return this.service.saveAddress(req.user.id, dto);
    }

    // DELETE /user/address/:id
    @Delete(':id')
    deleteAddress(@Req() req: any, @Param('id') id: string) {
        return this.service.deleteAddress(req.user.id, id);
    }

    // PATCH /user/address/:id/default
    @Patch(':id/default')
    setDefault(@Req() req: any, @Param('id') id: string) {
        return this.service.setDefault(req.user.id, id);
    }
}
