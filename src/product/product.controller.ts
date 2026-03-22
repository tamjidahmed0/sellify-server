import { Body, Controller, Post, UseInterceptors, UploadedFiles, BadRequestException, Get, Query, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/product.dto';
import { GetSuggestionsDto } from './dto/get-suggestions.dto';
import { imageUploadInterceptor } from 'src/common/interceptors/image-upload.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';







@Controller('product')
export class ProductController {

    constructor(private product: ProductService) { }


    // Create Product with image upload, slug generation, and inventory creation

    @Post('create')
    @UseGuards(AdminJwtAuthGuard)
    @UseInterceptors(imageUploadInterceptor)

    async createProduct(
        @UploadedFiles() files: {
            thumbnail: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
        @Body() createProductDto: CreateProductDto,
    ) {

        if (!files.thumbnail || !files.thumbnail[0]) {
            throw new BadRequestException('Thumbnail is required');
        }

        return this.product.createProduct(files, createProductDto);
    }




    @Patch(':id')
    @UseGuards(AdminJwtAuthGuard)
    @UseInterceptors(imageUploadInterceptor)
    async updateProduct(
        @Param('id') id: string,
        @UploadedFiles()
        files: {
            thumbnail?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
        @Body() updateProductDto,
    ) {
        return this.product.updateProduct(id, files ?? {}, updateProductDto);
    }



    @Delete(':id')
    @UseGuards(AdminJwtAuthGuard)
    async deleteProduct(@Param('id') id: string) {
        return this.product.deleteProduct(id);
    }





    @Get('author/edit/preview/:id')
    @UseGuards(AdminJwtAuthGuard)
    async productUpdatePreview(@Param('id') id: string) {
        return this.product.productUpdatePreview(id)
    }

    @Get('author/products')
    @UseGuards(AdminJwtAuthGuard)
    async getProductsByAuthor() {
        return this.product.getProductsByAuthor()
    }








    // GET /product/suggestions?q=shirt 
    @Get('suggestions')
    async getSuggestions(@Query() query: GetSuggestionsDto) {
        return this.product.getSuggestions(query.q);
    }





    // Get Products with pagination, filtering, and sorting
    @Get()
    async getProducts(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('category') categories?: string | string[],
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('search') search?: string,
    ) {


        const categoryArray = categories
            ? Array.isArray(categories)
                ? categories
                : [categories]
            : [];




        return this.product.getProducts({
            skip: skip ? parseInt(skip, 10) : 0,
            take: take ? parseInt(take, 10) : 20, // default 20
            categories: categoryArray,
            minPrice: minPrice ? parseInt(minPrice, 10) : 0,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
            search: search ?? undefined,
        });
    }


    // Get Product by Slug with details and related products

    @Get(':slug')
    async getProductBySlug(@Param('slug') slug: string) {

        const result = await this.product.getProductBySlug(slug);
        return result

    }






}
