import { Controller, Post, Body, Get, UseInterceptors, UploadedFile, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { AdminCategoryService } from './admin-category.service';
import { CategoryImageUploadInterceptor } from 'src/common/interceptors/image-upload.interceptor';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';




@Controller('category')
export class CategoryController {

    constructor(
        private category: CategoryService,
        private adminCategory: AdminCategoryService
    ) { }

    // Create category
    @UseInterceptors(CategoryImageUploadInterceptor)
    @Post('create')
    @UseGuards(AdminJwtAuthGuard)
    async createCategory(@Body('name') name: string, @UploadedFile() file: Express.Multer.File,) {
        return this.category.createCategory(name, file);
    }


    // Get all categories
    @Get()
    async getAllCategories() {
        return this.category.getAllCategories();
    }



    @Get('author')
    @UseGuards(AdminJwtAuthGuard)
    async getDashboardCategories() {
        return this.adminCategory.getAllCategories()
    }


    // PATCH category/:id
    @Patch(':id')
    @UseGuards(AdminJwtAuthGuard)
    @UseInterceptors(CategoryImageUploadInterceptor)
    updateCategory(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto,
    ) {
        return this.adminCategory.updateCategory(id, file, dto);
    }




    // DELETE /category/:id
    @Delete(':id')
    @UseGuards(AdminJwtAuthGuard)
    deleteCategory(@Param('id') id: string) {
        return this.adminCategory.deleteCategory(id);
    }




}