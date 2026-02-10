import { Controller, Post, Body, Get } from '@nestjs/common';
import { CategoryService } from './category.service';




@Controller('category')
export class CategoryController {

    constructor(private category: CategoryService) { }

    // Create category
    @Post('create')
    async createCategory(@Body('name') name: string) {
        return this.category.createCategory(name);
    }


    // Get all categories
    @Get()
    async getAllCategories() {
        return this.category.getAllCategories();
    }






}