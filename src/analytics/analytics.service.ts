import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    // ═══════════════════════════════════════════════════════════
    // STAT CARDS — total revenue, orders, products, users
    // ═══════════════════════════════════════════════════════════
    async getStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalRevenue,
            lastMonthRevenue,
            totalOrders,
            lastMonthOrders,
            totalProducts,
            lastMonthProducts,
            totalUsers,
            lastMonthUsers,
        ] = await Promise.all([
            // Total revenue (all time)
            this.prisma.order.aggregate({
                _sum: { totalPrice: true },
            }),
            // Last month revenue
            this.prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            }),
            // Total orders
            this.prisma.order.count(),
            // Last month orders
            this.prisma.order.count({
                where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            }),
            // Total products
            this.prisma.product.count(),
            // Last month products added
            this.prisma.product.count({
                where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            }),
            // Total users
            this.prisma.user.count(),
            // Last month new users
            this.prisma.user.count({
                where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            }),
        ]);

        return {
            revenue: {
                total: Number(totalRevenue._sum.totalPrice ?? 0),
                lastMonth: Number(lastMonthRevenue._sum.totalPrice ?? 0),
            },
            orders: {
                total: totalOrders,
                lastMonth: lastMonthOrders,
            },
            products: {
                total: totalProducts,
                lastMonth: lastMonthProducts,
            },
            users: {
                total: totalUsers,
                lastMonth: lastMonthUsers,
            },
        };
    }





    // ═══════════════════════════════════════════════════════════
    // ANALYTICS CHART — daily revenue, orders, visitors (users)
    // Query param: days (7 | 14 | 30 | 90)
    // ═══════════════════════════════════════════════════════════
    async getTimeSeries(days: number) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        from.setHours(0, 0, 0, 0);

        // Fetch all orders in range with createdAt
        const orders = await this.prisma.order.findMany({
            where: { createdAt: { gte: from } },
            select: { createdAt: true, totalPrice: true },
        });

        // Fetch all new users in range
        const users = await this.prisma.user.findMany({
            where: { createdAt: { gte: from } },
            select: { createdAt: true },
        });

        // Build a map keyed by date string "YYYY-MM-DD"
        const map: Record<string, { revenue: number; orders: number; visitors: number }> = {};

        // Initialize all days in range with zero values
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            map[key] = { revenue: 0, orders: 0, visitors: 0 };
        }

        // Aggregate orders per day
        for (const order of orders) {
            const key = order.createdAt.toISOString().split('T')[0];
            if (map[key]) {
                map[key].revenue += Number(order.totalPrice);
                map[key].orders += 1;
            }
        }

        // Aggregate new users per day as "visitors"
        for (const user of users) {
            const key = user.createdAt.toISOString().split('T')[0];
            if (map[key]) map[key].visitors += 1;
        }

        // Convert map to sorted array with a readable label
        return Object.entries(map).map(([date, values]) => {
            const d = new Date(date);
            const label =
                days <= 7
                    ? d.toLocaleDateString('en', { weekday: 'short' })
                    : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });

            return { date, label, ...values };
        });
    }








    // ═══════════════════════════════════════════════════════════
    // SALES BY CATEGORY — for pie chart
    // ═══════════════════════════════════════════════════════════
    async getCategoryBreakdown() {
        // Sum order item prices grouped by product category
        const orderItems = await this.prisma.orderItem.findMany({
            select: {
                price: true,
                quantity: true,
                product: {
                    select: {
                        categories: { select: { name: true } },
                    },
                },
            },
        });

        const categoryRevenue: Record<string, number> = {};

        for (const item of orderItems) {
            const revenue = Number(item.price) * item.quantity;
            const cats = item.product.categories;

            if (cats.length === 0) {
                categoryRevenue['Uncategorized'] = (categoryRevenue['Uncategorized'] ?? 0) + revenue;
            } else {
                for (const cat of cats) {
                    categoryRevenue[cat.name] = (categoryRevenue[cat.name] ?? 0) + revenue;
                }
            }
        }

        const total = Object.values(categoryRevenue).reduce((a, b) => a + b, 0);

        // Sort by revenue desc, return percentage
        return Object.entries(categoryRevenue)
            .sort(([, a], [, b]) => b - a)
            .map(([name, revenue]) => ({
                name,
                revenue: Math.round(revenue),
                value: total > 0 ? Math.round((revenue / total) * 100) : 0,
            }));
    }










    // ═══════════════════════════════════════════════════════════
    // TOP PRODUCTS — by sales volume
    // ═══════════════════════════════════════════════════════════
    async getTopProducts(limit = 5) {
        const products = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true, price: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
        });

        // Fetch product names
        const productIds = products.map((p) => p.productId);
        const productDetails = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });

        const nameMap = Object.fromEntries(productDetails.map((p) => [p.id, p.name]));
        const maxSales = products[0]?._sum.quantity ?? 1;

        return products.map((p) => ({
            name: nameMap[p.productId] ?? 'Unknown',
            sales: p._sum.quantity ?? 0,
            revenue: `$${Number(p._sum.price ?? 0).toLocaleString()}`,
            // Percentage relative to the top product
            pct: Math.round(((p._sum.quantity ?? 0) / maxSales) * 100),
        }));
    }









    // ═══════════════════════════════════════════════════════════
    // RECENT ORDERS — latest 10 orders for the table
    // ═══════════════════════════════════════════════════════════
    async getRecentOrders(limit = 10) {
        const orders = await this.prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                totalPrice: true,
                status: true,
                createdAt: true,
                userId: true,
            },
        });

        // Fetch user details separately (User has no relation to Order in schema)
        const userIds = [...new Set(orders.map((o) => o.userId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        return orders.map((o) => {
            const user = userMap[o.userId];
            const fullName = user
                ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
                : 'Unknown';

            return {
                id: `#${o.id.slice(0, 8).toUpperCase()}`,
                customer: fullName,
                total: `$${Number(o.totalPrice).toLocaleString()}`,
                status: o.status,
                createdAt: o.createdAt,
            };
        });
    }









}
