import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewService {

    constructor(private readonly prisma: PrismaService) { }


    // ─── Create Review
    async createReview(dto: CreateReviewDto, userId: string) {
        const { productId, rating, comment } = dto;

        // Product exists?
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) throw new NotFoundException('Product not found');

        // User already reviewed this product?
        const existing = await this.prisma.review.findFirst({
            where: { userId, productId },
        });
        if (existing) {
            throw new BadRequestException(
                'You have already reviewed this product',
            );
        }

        // User must have a DELIVERED order containing this product
        const deliveredOrder = await this.prisma.order.findFirst({
            where: {
                userId,
                status: 'DELIVERED',
                items: { some: { productId } },
            },
        });
        if (!deliveredOrder) {
            throw new BadRequestException(
                'You can only review products you have purchased and received',
            );
        }

        // Create review + update product rating in transaction
        const review = await this.prisma.$transaction(async (tx) => {
            const newReview = await tx.review.create({
                data: { userId, productId, rating, comment },
            });

            // Recalculate product rating
            const agg = await tx.review.aggregate({
                where: { productId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.product.update({
                where: { id: productId },
                data: {
                    rating: agg._avg.rating ?? 0,
                    reviewsCount: agg._count.rating,
                },
            });

            return newReview;
        });

        return review;
    }




    // ─── Get Reviews by User
    async getUserReviews(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        select: { id: true, name: true, image: true, slug: true, images: true },
                    },
                },
            }),
            this.prisma.review.count({ where: { userId } }),
        ]);

        return {
            data: reviews,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }




    // ─── Get Reviews for a Product
    async getProductReviews(productId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) throw new NotFoundException('Product not found');

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { productId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.review.count({ where: { productId } }),
        ]);

        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                averageRating: product.rating,
                reviewsCount: product.reviewsCount,
            },
        };
    }



    // ─── Update Review
    async updateReview(id: string, userId: string, dto: UpdateReviewDto) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) throw new NotFoundException('Review not found');

        if (review.userId !== userId) {
            throw new BadRequestException('You can only edit your own reviews');
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const updatedReview = await tx.review.update({
                where: { id },
                data: dto,
            });

            // Recalculate rating
            const agg = await tx.review.aggregate({
                where: { productId: review.productId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.product.update({
                where: { id: review.productId },
                data: {
                    rating: agg._avg.rating ?? 0,
                    reviewsCount: agg._count.rating,
                },
            });

            return updatedReview;
        });

        return updated;
    }





    // ─── Delete Review
    async deleteReview(id: string, userId: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) throw new NotFoundException('Review not found');

        if (review.userId !== userId) {
            throw new BadRequestException('You can only delete your own reviews');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.review.delete({ where: { id } });

            // Recalculate rating after delete
            const agg = await tx.review.aggregate({
                where: { productId: review.productId },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.product.update({
                where: { id: review.productId },
                data: {
                    rating: agg._avg.rating ?? 0,
                    reviewsCount: agg._count.rating,
                },
            });
        });

        return { message: 'Review deleted successfully' };
    }








    async getPublicReviews(slug: string, page: number, limit: number) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!product) throw new NotFoundException('Product not found');

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { productId: product.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    userId: true,
                },
            }),
            this.prisma.review.count({
                where: { productId: product.id },
            }),
        ]);

        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit),
            },
        };
    }







}
