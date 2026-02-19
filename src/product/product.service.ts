import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import slugify from 'slugify';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';


@Injectable()
export class ProductService {

    constructor(
        private readonly prisma: PrismaService,
        private cloudinary: CloudinaryService

    ) { }


    // Create Product with image upload, slug generation, and inventory creation

    async createProduct(files: {
        thumbnail: Express.Multer.File[];
        images?: Express.Multer.File[];
    }, createProductDto: CreateProductDto) {

        let uploadUrls: any = []
        let thumbnailUrl: any;

        for (const file of files.images ?? []) {
            const url = await this.cloudinary.uploadFile(file, 'e-commerce/product-images')

            uploadUrls.push(url)
        }


        if (files.thumbnail?.[0]) {
            thumbnailUrl = await this.cloudinary.uploadFile(files.thumbnail?.[0], 'e-commerce/product-thumbnail')
        }



        const baseSlug = slugify(createProductDto.name, { lower: true, strict: true });

        // unique slug
        let slug = baseSlug;
        let count = 1;

        while (await this.prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count++}`;
        }

        const { stock, categoryId, ...productData } = createProductDto;

        const categoryIds = Array.isArray(createProductDto.categoryId)
            ? createProductDto.categoryId
            : [createProductDto.categoryId]; // wrap single id in an array


        const product = await this.prisma.product.create({
            data: {
                ...productData,
                slug,
                image: thumbnailUrl.url,
                categories: {
                    connect: categoryIds.map(id => ({ id })),
                },
                images: {
                    createMany: {
                        data: uploadUrls
                    }
                },
                inventory: {
                    create: {
                        stock: Number(stock)
                    }
                }

            },
            include: { images: true, inventory: true, categories: true }
        })



        return product;
    }


    // Get Products with pagination, filtering by category and price range

    async getProducts(pagination: { skip: number, take: number, categories: string[], minPrice: number, maxPrice: number | undefined }) {
        const result = await this.prisma.product.findMany({
            skip: pagination.skip,
            take: pagination.take,
            orderBy: {
                createdAt: 'desc'
            },


            where: {
                AND: [
                    pagination.categories.length
                        ? {
                            categories: {
                                some: { name: { in: pagination.categories } },
                            },
                        }
                        : {},
                    {
                        price: {
                            gte: pagination.minPrice,
                            ...(pagination.maxPrice !== undefined && { lte: pagination.maxPrice }),
                        },
                    },
                ],
            },



            select: {
                id: true,
                name: true,
                price: true,
                originalPrice: true,
                image: true,
                rating: true,
                reviewsCount: true,
                slug: true,
                categories: true,
                inventory: {
                    select: {
                        stock: true
                    }
                }

            }
        })




        return result.map((product) => {
            const stock = product.inventory?.stock ?? 0;

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                rating: product.rating,
                reviewsCount: product.reviewsCount,
                slug: product.slug,
                categories: product.categories,
                inStock: stock > 0,
            };
        });



    }


    //get product by slug
    async getProductBySlug(slug: string) {

        const result = await this.prisma.product.findUnique({
            where: {
                slug: slug
            },
            include: {
                categories: true,
                images: true,
                inventory: {
                    select: {
                        stock: true
                    }
                }
            }
        })

        if (!result) return null;
        const stock = result.inventory?.stock ?? 0;


        return {
            ...result,
            inStock: stock > 0,
            inventory: undefined,
        };
    }




}
