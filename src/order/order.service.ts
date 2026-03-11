import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) { }

    //  Get Orders By User 
    async createOrder(productIds: string[], userId: string) {
        if (!productIds || productIds.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        return this.prisma.$transaction(async (prisma) => {
            // 1. Get cart actual quantity 
            const cart = await prisma.cart.findFirst({
                where: { userId },
                include: {
                    items: {
                        where: { productId: { in: productIds } },
                    },
                },
            });

            // 2. Products + inventory
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                include: { inventory: true },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException('Some products not found');
            }

            // 3. Calculate total — cart quantity 
            let totalPrice = new Decimal(0);
            const orderItemsData: {
                productId: string;
                quantity: number;
                price: Decimal;
            }[] = [];

            for (const productId of productIds) {
                const product = products.find((p) => p.id === productId);
                if (!product) throw new BadRequestException('Product not found');

                // Get quantity from cart if nothing then 1
                const cartItem = cart?.items.find((i) => i.productId === productId);
                const quantity = cartItem?.quantity ?? 1;

                if (!product.inventory || product.inventory.stock < quantity) {
                    throw new BadRequestException(
                        `Not enough stock for ${product.name}`
                    );
                }

                const price = new Decimal(product.price.toString());
                totalPrice = totalPrice.plus(price.times(quantity));
                orderItemsData.push({ productId, quantity, price });
            }

            // 4. Inventory deduct — quantity
            await Promise.all(
                orderItemsData.map(({ productId, quantity }) =>
                    prisma.inventory.update({
                        where: { productId },
                        data: { stock: { decrement: quantity } },
                    })
                )
            );

            // 5. Order create
            const order = await prisma.order.create({
                data: {
                    userId,
                    totalPrice: totalPrice.toFixed(2),
                    items: { create: orderItemsData },
                },
                include: { items: true },
            });

            // 6. Cart items clear
            if (cart) {
                await prisma.cartItem.deleteMany({
                    where: {
                        cartId: cart.id,
                        productId: { in: productIds },
                    },
                });

                await prisma.cart.delete({ where: { id: cart.id } });
            }

            return order;
        }, {
            maxWait: 10000,
            timeout: 20000,
        });
    }



    // async findOrdersByUser(userId: string, page = 1, limit = 10) {
    //     const skip = (page - 1) * limit;

    //     const [orders, total] = await Promise.all([
    //         this.prisma.order.findMany({
    //             where: { userId },
    //             skip,
    //             take: limit,
    //             orderBy: { createdAt: 'desc' },
    //             include: {
    //                 items: {
    //                     include: {
    //                         product: {
    //                             select: { id: true, name: true, image: true, slug: true },
    //                         },
    //                     },
    //                 },
    //             },
    //         }),
    //         this.prisma.order.count({ where: { userId } }),
    //     ]);

    //     return {
    //         data: orders,
    //         meta: {
    //             total,
    //             page,
    //             limit,
    //             totalPages: Math.ceil(total / limit),
    //         },
    //     };
    // }


    async findOrdersByUser(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, image: true, slug: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.order.count({ where: { userId } }),
        ]);

        // User review fetch
        const reviewedProductIds = await this.prisma.review.findMany({
            where: { userId },
            select: { productId: true },
        });

        const reviewedSet = new Set(reviewedProductIds.map((r) => r.productId));

        // item hasReviewed flag 
        const ordersWithReviewStatus = orders.map((order) => ({
            ...order,
            items: order.items.map((item) => ({
                ...item,
                hasReviewed: reviewedSet.has(item.productId),
            })),
        }));

        return {
            data: ordersWithReviewStatus,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }







}
