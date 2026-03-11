import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('order')
export class OrderController {

    constructor(private readonly order: OrderService) { }



    // GET /order?page=1&limit=10 
    // All orders for a specific user

    @UseGuards(JwtAuthGuard)
    @Get()
    async getOrdersByUser(
        @Req() req,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        const userId = req.user.id
        return this.order.findOrdersByUser(userId, +page, +limit);
    }




}
