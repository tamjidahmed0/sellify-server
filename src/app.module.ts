import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductController } from './product/product.controller';
import { ProductModule } from './product/product.module';
import { ReviewModule } from './review/review.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, CategoryModule, ProductModule, ReviewModule, PrismaModule, CloudinaryModule, ConfigModule.forRoot({isGlobal:true,  envFilePath: '.env',})],
  controllers: [],
  providers: [],
})
export class AppModule { }
