import { Controller, Post, Body, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CategoryService } from './category.service';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { AdminCategoryService } from './admin-category.service';




@Controller('category')
export class CategoryController {

    constructor(
        private category: CategoryService,
        private adminCategory : AdminCategoryService
    ) { }

    // Create category
    @UseInterceptors(
        FileInterceptor('file', {
            storage: multer.memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        }),
    )
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
    async getDashboardCategories (){
        return this.adminCategory.getAllCategories()
    }






}