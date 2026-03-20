import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { extractPublicId } from 'src/common/helper/cloudinary.helper';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class AdminCategoryService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService
    ) { }



    async getAllCategories() {
        const categories = await this.prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }, // count how many products belong to this category
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Reshape response — flatten _count.products into productCount
        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            image: c.image,
            createdAt: c.createdAt,
            productCount: c._count.products,
        }));
    }



    async updateCategory(
        id: string,
        file: Express.Multer.File | undefined,
        dto,
    ) {
        const existing = await this.prisma.category.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Category not found');

        let imageUrl: string | undefined;

        if (file) {
            // Delete old image from Cloudinary before uploading the new one
            if (existing.image) {
                const publicId = extractPublicId(existing.image);
                if (publicId) await this.cloudinary.deleteFile(publicId);
            }

            const uploaded = await this.cloudinary.uploadFile(file, 'e-commerce/categories');
            imageUrl = uploaded.url;
        }

        const category = await this.prisma.category.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(imageUrl && { image: imageUrl }),
            },
        });

        return { success: true, id: category.id };
    }



    async deleteCategory(id: string) {
        const existing = await this.prisma.category.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Category not found');

        // Delete category image from Cloudinary if it exists
        if (existing.image) {
            const publicId = extractPublicId(existing.image);
            if (publicId) await this.cloudinary.deleteFile(publicId);
        }

        await this.prisma.category.delete({ where: { id } });

        return { success: true, message: 'Category deleted successfully' };
    }




}
