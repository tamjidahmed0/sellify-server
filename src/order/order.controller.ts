import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('create')
    async createOrder(@Req() data,   @Body() dto: CreateOrderDto) {
        return this.orderService.createOrder(dto, data.user.id);
    }
}
