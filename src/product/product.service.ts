import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import slugify from 'slugify';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { extractPublicId } from 'src/common/helper/cloudinary.helper';

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



        return {
            success: true,
            id: product.id
        };
    }




    async productUpdatePreview(id: string) {
        return this.prisma.product.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                name: true,
                description: true,
                originalPrice: true,
                price: true,
                image: true,

                images: true,
                inventory: {
                    select: {
                        stock: true
                    }
                },
                categories: true


            },

        })
    }


    async getProductsByAuthor() {
        return this.prisma.product.findMany({
            select: {
                id: true,
                name: true,
                image: true,
                categories: {
                    select: {
                        name: true
                    }
                },
                originalPrice: true,
                price: true,
                inventory: {
                    select: {
                        stock: true
                    }
                }

            }
        })
    }



    // Get Products with pagination, filtering by category and price range

    async getProducts(pagination: { skip: number, take: number, search: string | undefined, categories: string[], minPrice: number, maxPrice: number | undefined }) {
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

                    pagination.search
                        ? {
                            OR: [
                                { name: { contains: pagination.search, mode: 'insensitive' } },
                                { description: { contains: pagination.search, mode: 'insensitive' } },
                                { slug: { contains: pagination.search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
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
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        userId: true,
                    },
                },
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



    async getSuggestions(q: string) {

        const products = await this.prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
                categories: {
                    select: { name: true },
                },
            },
            take: 6,
            orderBy: { rating: 'desc' },
        });

        return products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.image,
            price: p.price,
            category: p.categories[0]?.name ?? null,
        }));
    }






    async updateProduct(
        id: string,
        files: {
            thumbnail?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
        updateProductDto,
    ) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true, categories: true },
        });
        if (!existing) throw new NotFoundException('Product not found');

        // ── Thumbnail — delete old, upload new ─────────────────────────────────
        let thumbnailUrl: string | undefined;
        if (files.thumbnail?.[0]) {
            if (existing.image) {
                const oldPublicId = extractPublicId(existing.image);
                if (oldPublicId) await this.cloudinary.deleteFile(oldPublicId);
            }
            const uploaded = await this.cloudinary.uploadFile(
                files.thumbnail[0],
                'e-commerce/product-thumbnail',
            );
            thumbnailUrl = uploaded.url;
        }

        // ── New images — upload to Cloudinary ──────────────────────────────────
        const newImageUrls: { url: string }[] = [];
        for (const file of files.images ?? []) {
            const uploaded = await this.cloudinary.uploadFile(file, 'e-commerce/product-images');
            newImageUrls.push({ url: uploaded.url });
        }

        // ── Removed images — delete from Cloudinary + DB ───────────────────────
        // Frontend sends existingImageUrls = the URLs the user kept
        // Any DB image NOT in that list was removed by the user
        if (updateProductDto.existingImageUrls !== undefined) {
            const keptUrls: string[] = Array.isArray(updateProductDto.existingImageUrls)
                ? updateProductDto.existingImageUrls
                : updateProductDto.existingImageUrls
                    ? [updateProductDto.existingImageUrls]
                    : [];

            const imagesToDelete = existing.images.filter(
                (img) => !keptUrls.includes(img.url),
            );

            for (const img of imagesToDelete) {
                const publicId = extractPublicId(img.url);
                if (publicId) await this.cloudinary.deleteFile(publicId);
                await this.prisma.productImage.delete({ where: { id: img.id } });
            }
        }

        // ── Slug — only regenerate if name changed 
        let slug = existing.slug;
        if (updateProductDto.name && updateProductDto.name !== existing.name) {
            // slug = await this.generateSlug(updateProductDto.name, id);
            slug = slugify(updateProductDto.name, { lower: true, strict: true });
        }

        const { stock, categoryId, existingImageUrls, ...productData } = updateProductDto;

        const categoryIds = categoryId
            ? Array.isArray(categoryId) ? categoryId : [categoryId]
            : null;

        const product = await this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                slug,
                ...(thumbnailUrl && { image: thumbnailUrl }),
                ...(categoryIds && {
                    categories: {
                        set: [],
                        connect: categoryIds.map((cid) => ({ id: cid })),
                    },
                }),
                ...(newImageUrls.length > 0 && {
                    images: { createMany: { data: newImageUrls } },
                }),
                ...(stock !== undefined && {
                    inventory: { update: { stock: Number(stock) } },
                }),
            },
            include: { images: true, inventory: true, categories: true },
        });

        return { success: true, id: product.id };
    }






    async deleteProduct(id: string) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });
        if (!existing) throw new NotFoundException('Product not found');

        // Delete all product images from Cloudinary
        for (const img of existing.images) {
            const publicId = extractPublicId(img.url);
            if (publicId) await this.cloudinary.deleteFile(publicId);
        }

        // Delete thumbnail from Cloudinary
        if (existing.image) {
            const publicId = extractPublicId(existing.image);
            if (publicId) await this.cloudinary.deleteFile(publicId);
        }

        // Delete child records manually (no onDelete: Cascade in schema)
        await this.prisma.productImage.deleteMany({ where: { productId: id } });
        await this.prisma.inventory.deleteMany({ where: { productId: id } });
        await this.prisma.review.deleteMany({ where: { productId: id } });
        await this.prisma.cartItem.deleteMany({ where: { productId: id } });

        await this.prisma.product.delete({ where: { id } });

        return { success: true, message: 'Product deleted successfully' };
    }









}
