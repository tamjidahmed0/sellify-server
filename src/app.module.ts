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


 
@Module({
  imports: [AuthModule, CategoryModule, ProductModule, ReviewModule, PrismaModule, CloudinaryModule, ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', }), CartModule, OrderModule, ProfileModule, StripeModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
