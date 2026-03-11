import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('review')
export class ReviewController {
    constructor(private readonly review: ReviewService) { }

    //reviews 
    // Body: {productId, rating, comment? }
    @UseGuards(JwtAuthGuard)
    @Post()
    createReview(@Body() dto: CreateReviewDto, @Req() req) {
        const userId = req.user.id

        return this.review.createReview(dto, userId);
    }


    // ─── GET /review/user/:userId?page=1&limit=10
    @UseGuards(JwtAuthGuard)
    @Get('user')
    getUserReviews(
        @Req() req,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        const userId = req.user.id
        return this.review.getUserReviews(userId, +page, +limit);
    }



    // ─── GET /review/product/:productId?page=1&limit=10 
    @Get('product/:productId')
    getProductReviews(
        @Param('productId') productId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        return this.review.getProductReviews(productId, +page, +limit);
    }



    // ─── PATCH /review/:id
    // Body: {rating?, comment? }
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateReview(
        @Req() req,
        @Param('id') id: string,
        @Body() body: UpdateReviewDto,
    ) {
        const userId = req.user.id
        return this.review.updateReview(id, userId, body);
    }



    // ─── DELETE /review/:id
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deleteReview(
        @Req() req,
        @Param('id') id: string,
    ) {
        const userId = req.user.id
        return this.review.deleteReview(id, userId);
    }


}
