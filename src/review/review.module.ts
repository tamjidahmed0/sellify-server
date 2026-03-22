import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminReviewService } from './admin.review.service';
import { AdminReviewController } from './admin.review.controller';

@Module({
  imports:[PrismaModule],
  controllers: [ReviewController, AdminReviewController],
  providers: [ReviewService, AdminReviewService]
})
export class ReviewModule {}
