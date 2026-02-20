import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';
import Decimal from 'decimal.js';

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) { }

    async createOrder(dto: CreateOrderDto) {
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        const productIds = dto.items.map(item => item.productId);

        return this.prisma.$transaction(async (prisma) => {
            // 1. Get products
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                include: { inventory: true },
            });

            if (products.length !== dto.items.length) {
                throw new BadRequestException('Some products not found');
            }

            // 2. Calculate total price & prepare data
            let totalPrice = new Decimal(0);
            const orderItemsData: { productId: string; quantity: number; price: Decimal }[] = [];

            for (const item of dto.items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) throw new BadRequestException('Product not found');
                if (!product.inventory || product.inventory.stock < item.quantity) {
                    throw new BadRequestException(`Not enough stock for ${product.name}`);
                }

                const price = new Decimal(product.price.toString());
                totalPrice = totalPrice.plus(price.times(item.quantity));
                orderItemsData.push({ productId: item.productId, quantity: item.quantity, price });
            }

            // 3. Inventory deduct parallel
            await Promise.all(
                dto.items.map(item =>
                    prisma.inventory.update({
                        where: { productId: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    })
                )
            );

            // 4. Create order
            const order = await prisma.order.create({
                data: {
                    userId: dto.userId,
                    totalPrice: totalPrice.toFixed(2),
                    items: { create: orderItemsData },
                },
                include: { items: true },
            });

            // 5. Cart clear 
            const cart = await prisma.cart.findFirst({ where: { userId: dto.userId } });
            if (cart) {
                await prisma.cartItem.deleteMany({
                    where: { cartId: cart.id, productId: { in: productIds } },
                });
            }

            return order;
        }, {
            maxWait: 10000,
            timeout: 20000,
        });
    }



}
