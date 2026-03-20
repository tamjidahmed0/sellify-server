import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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



    // GET all orders with filters + pagination
    async getOrders(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;

        // Build dynamic where clause
        const where: any = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.dateFrom || query.dateTo) {
            where.createdAt = {
                ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
                ...(query.dateTo && { lte: new Date(query.dateTo + 'T23:59:59Z') }),
            };
        }

        // Search by user email or name — fetch matching user ids first
        if (query.search) {
            const users = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query.search, mode: 'insensitive' } },
                        { firstName: { contains: query.search, mode: 'insensitive' } },
                        { lastName: { contains: query.search, mode: 'insensitive' } },
                    ],
                },
                select: { id: true },
            });
            where.userId = { in: users.map((u) => u.id) };
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { select: { id: true } }, // just need count
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        // Attach customer info
        const userIds = [...new Set(orders.map((o) => o.userId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
        });
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        const data = orders.map((o) => {
            const user = userMap[o.userId];
            const customer = user
                ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
                : 'Unknown';

            return {
                id: `#${o.id.slice(0, 8).toUpperCase()}`,
                rawId: o.id,
                customer,
                email: user?.email ?? '',
                date: o.createdAt.toISOString(),
                items: o.items.length,
                total: `$${Number(o.totalPrice).toLocaleString()}`,
                status: o.status,
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }



    // PATCH — update order status
    async updateOrderStatus(id: string, status) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        const updated = await this.prisma.order.update({
            where: { id },
            data: { status },
        });

        return { success: true, status: updated.status };
    }


}
