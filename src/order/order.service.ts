import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) { }

    //  Get Orders By User 

    async createOrder(productIds: string[], userId: string, address?) {
        if (!productIds || productIds.length === 0) {
            throw new BadRequestException('Order must contain at least one item');
        }

        return this.prisma.$transaction(async (prisma) => {

            // 1. Get cart with actual quantities
            const cart = await prisma.cart.findFirst({
                where: { userId },
                include: {
                    items: {
                        where: { productId: { in: productIds } },
                    },
                },
            });

            // 2. Fetch products + inventory
            const products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                include: { inventory: true },
            });

            if (products.length !== productIds.length) {
                throw new BadRequestException('Some products not found');
            }

            // 3. Calculate total using cart quantities
            let totalPrice = new Decimal(0);
            const orderItemsData: {
                productId: string;
                quantity: number;
                price: Decimal;
            }[] = [];

            for (const productId of productIds) {
                const product = products.find((p) => p.id === productId);
                if (!product) throw new BadRequestException('Product not found');

                const cartItem = cart?.items.find((i) => i.productId === productId);
                const quantity = cartItem?.quantity ?? 1;

                if (!product.inventory || product.inventory.stock < quantity) {
                    throw new BadRequestException(`Not enough stock for ${product.name}`);
                }

                const price = new Decimal(product.price.toString());
                totalPrice = totalPrice.plus(price.times(quantity));
                orderItemsData.push({ productId, quantity, price });
            }

            // 4. Deduct inventory stock
            await Promise.all(
                orderItemsData.map(({ productId, quantity }) =>
                    prisma.inventory.update({
                        where: { productId },
                        data: { stock: { decrement: quantity } },
                    })
                )
            );

            // 5. Create order — address fields 
            const order = await prisma.order.create({
                data: {
                    userId,
                    totalPrice: totalPrice.toFixed(2),
                    items: { create: orderItemsData },

                    // Delivery address — webhook
                    addressLine: address?.addressLine ?? null,
                    city: address?.city ?? null,
                    state: address?.state ?? null,
                    zipCode: address?.zipCode ?? null,
                    country: address?.country ?? null,
                },
                include: { items: true },
            });

            // 6. Clear cart after order is placed
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




    // PATCH — update status and append to history
    async updateOrderStatus(id: string, status) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');

        // Update status + create history entry in a transaction
        const [updated] = await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id },
                data: { status },
            })

        ]);

        return { success: true, status: updated.status };
    }








    // GET single order with all details
    async getOrderById(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                                slug: true,
                            },
                        },
                    },
                },

            },
        });

        if (!order) throw new NotFoundException('Order not found');

        // Fetch customer info separately (no relation in schema)
        const user = await this.prisma.user.findUnique({
            where: { id: order.userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                picture: true,
            },
        });

        const customer = user
            ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
            : 'Unknown';

        return {
            id: `#${order.id.slice(0, 8).toUpperCase()}`,
            rawId: order.id,
            status: order.status,
            createdAt: order.createdAt,
            totalPrice: Number(order.totalPrice),

            // Customer info
            customer: {
                name: customer,
                email: user?.email ?? '',
                picture: user?.picture ?? null,
            },

            // Delivery address
            address: {
                line: order.addressLine ?? null,
                city: order.city ?? null,
                state: order.state ?? null,
                zipCode: order.zipCode ?? null,
                country: order.country ?? null,
            },

            // Order items
            items: order.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                productImage: item.product.image,
                quantity: item.quantity,
                price: Number(item.price),
                subtotal: Number(item.price) * item.quantity,
            })),


        };
    }







}
