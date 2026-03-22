import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class AdminReviewService {

    constructor(private readonly prisma: PrismaService) { }



    // GET all reviews with filters + pagination
    async getReviews(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.productId) where.productId = query.productId;
        if (query.rating) where.rating = Number(query.rating);

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { id: true, name: true, image: true } },
                },
            }),
            this.prisma.review.count({ where }),
        ]);

        // Attach user info
        const userIds = [...new Set(reviews.map((r) => r.userId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true, picture: true },
        });
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        const data = reviews.map((r) => {
            const user = userMap[r.userId];
            return {
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                product: {
                    id: r.product.id,
                    name: r.product.name,
                    image: r.product.image,
                },
                user: {
                    name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'Unknown',
                    email: user?.email ?? '',
                    picture: user?.picture ?? null,
                },
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
            // Overall rating stats
            stats: await this.getStats(query.productId),
        };
    }

    // Rating stats — overall or per product
    async getStats(productId?: string) {
        const where = productId ? { productId } : {};

        const [total, avgResult, distribution] = await Promise.all([
            this.prisma.review.count({ where }),
            this.prisma.review.aggregate({ where, _avg: { rating: true } }),
            // Count per rating (1-5)
            Promise.all([1, 2, 3, 4, 5].map(async (r) => ({
                rating: r,
                count: await this.prisma.review.count({ where: { ...where, rating: r } }),
            }))),
        ]);

        return {
            total,
            average: Math.round((avgResult._avg.rating ?? 0) * 10) / 10,
            distribution, // [{ rating: 1, count: 2 }, ...]
        };
    }

    // DELETE a review
    async deleteReview(id: string) {
        const existing = await this.prisma.review.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Review not found');

        await this.prisma.review.delete({ where: { id } });
        return { success: true };
    }
}





