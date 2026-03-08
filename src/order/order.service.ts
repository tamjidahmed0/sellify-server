import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) { }

    async createOrder(productIds: string[], userId: string) {
        console.log(productIds, 'productIds');

        if (!productIds || productIds.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        return this.prisma.$transaction(async (prisma) => {
            // 1. Get products
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                include: { inventory: true },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException('Some products not found');
            }

            // 2. Calculate total price
            let totalPrice = new Decimal(0);
            const orderItemsData: { productId: string; quantity: number; price: Decimal }[] = [];

            for (const productId of productIds) {
                const product = products.find(p => p.id === productId);
                if (!product) throw new BadRequestException('Product not found');
                if (!product.inventory || product.inventory.stock < 1) {
                    throw new BadRequestException(`Not enough stock for ${product.name}`);
                }

                const price = new Decimal(product.price.toString());
                totalPrice = totalPrice.plus(price.times(1));
                orderItemsData.push({ productId, quantity: 1, price });
            }

            // 3. Inventory deduct
            await Promise.all(
                productIds.map(productId =>
                    prisma.inventory.update({
                        where: { productId },
                        data: { stock: { decrement: 1 } },
                    })
                )
            );

            // 4. Create order
            const order = await prisma.order.create({
                data: {
                    userId,
                    totalPrice: totalPrice.toFixed(2),
                    items: { create: orderItemsData },
                },
                include: { items: true },
            });

            // 5. Cart clear
            const cart = await prisma.cart.findFirst({ where: { userId } });
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
