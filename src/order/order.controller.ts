import { Controller, Get, Query, UseGuards, Req, DefaultValuePipe, ParseIntPipe, Param, Body, Patch } from '@nestjs/common';
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





    // GET /order?page=1&limit=10&search=john&status=PENDING&dateFrom=2026-01-01&dateTo=2026-03-31
    @Get('author')
    getOrders(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
        @Query('status') status?,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
    ) {
        return this.order.getOrders({ page, limit, search, status, dateFrom, dateTo });
    }



    // PATCH /order/author/:id/status
    @Patch('author/:id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() dto,
    ) {
        return this.order.updateOrderStatus(id, dto.status);
    }



    @Get(':id')
    getOrder(@Param('id') id: string) {
        return this.order.getOrderById(id);
    }





}
