import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminReviewService } from './admin.review.service';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';

@Controller('admin/reviews')
@UseGuards(AdminJwtAuthGuard)
export class AdminReviewController {
    constructor(private readonly reviews: AdminReviewService) { }

    // GET /admin/reviews?page=1&limit=10&productId=xxx&rating=5
    @Get()
    getReviews(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('productId') productId?: string,
        @Query('rating', new DefaultValuePipe(0), ParseIntPipe) rating?: number,
    ) {
        return this.reviews.getReviews({ page, limit, productId, rating: rating || undefined });
    }

    // GET /admin/reviews/stats
    @Get('stats')
    getStats(@Query('productId') productId?: string) {
        return this.reviews.getStats(productId);
    }

    // DELETE /admin/reviews/:id
    @Delete(':id')
    deleteReview(@Param('id') id: string) {
        return this.reviews.deleteReview(id);
    }
}
