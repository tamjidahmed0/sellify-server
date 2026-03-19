import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AdminCategoryService } from './admin-category.service';



@Module({
  imports : [PrismaModule, CloudinaryModule],
  providers: [CategoryService, AdminCategoryService],
  controllers: [CategoryController]
})
export class CategoryModule {}
