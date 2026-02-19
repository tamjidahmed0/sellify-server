import { Body, Controller, Post, UseInterceptors, UploadedFiles, BadRequestException, Get, Query, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/product.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('product')
export class ProductController {

    constructor(private product: ProductService) { }


    // Create Product with image upload, slug generation, and inventory creation

    @Post('create')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'thumbnail', maxCount: 1 },   // single
            { name: 'images', maxCount: 10 },     // multiple
        ], {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
                    cb(null, true);
                } else {
                    cb(new Error('Only images allowed'), false);
                }
            },
        }),
    )

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


    // Get Products with pagination, filtering, and sorting

    @Get()
    async getProducts(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('category') categories?: string | string[],
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
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
        });
    }


    // Get Product by Slug with details and related products

    @Get(':slug')
    async getProductBySlug(@Param('slug') slug: string) {

        const result = await this.product.getProductBySlug(slug);
        return result

    }




}
