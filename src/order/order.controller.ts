import { Controller, Post, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('create')
    async createOrder(@Body() dto: CreateOrderDto) {
        return this.orderService.createOrder(dto);
    }
}
