import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ProfileModule } from './profile/profile.module';
import { StripeModule } from './stripe/stripe.module';
import { SlidesModule } from './slides/slides.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UserAddressModule } from './user-address/user-address.module';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';


 
@Module({
  imports: [AuthModule, CategoryModule, ProductModule, ReviewModule, PrismaModule, CloudinaryModule, ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', }), CartModule, OrderModule, ProfileModule, StripeModule, SlidesModule, AnalyticsModule, UserAddressModule, SentryModule.forRoot()],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter
    }
  ],
})
export class AppModule { }
