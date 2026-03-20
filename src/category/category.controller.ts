import { Controller, Post, Body, Get, UseInterceptors, UploadedFile, Patch, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { AdminCategoryService } from './admin-category.service';
import { CategoryImageUploadInterceptor } from 'src/common/interceptors/image-upload.interceptor';




@Controller('category')
export class CategoryController {

    constructor(
        private category: CategoryService,
        private adminCategory: AdminCategoryService
    ) { }

    // Create category
    @UseInterceptors(CategoryImageUploadInterceptor)
    @Post('create')
    async createCategory(@Body('name') name: string, @UploadedFile() file: Express.Multer.File,) {
        return this.category.createCategory(name, file);
    }


    // Get all categories
    @Get()
    async getAllCategories() {
        return this.category.getAllCategories();
    }



    @Get('author')
    async getDashboardCategories() {
        return this.adminCategory.getAllCategories()
    }


    // PATCH category/:id
    @Patch(':id')
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
    deleteCategory(@Param('id') id: string) {
        return this.adminCategory.deleteCategory(id);
    }










}