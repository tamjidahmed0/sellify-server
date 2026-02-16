import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService
    ) { }

    async createCategory(name: string, file: Express.Multer.File) {
        // Check if category already exists
        const existing = await this.prisma.category.findFirst({
            where: { name },
        });

        if (existing) {
            throw new BadRequestException(`Category "${name}" already exists`);
        }

        const result = await this.cloudinary.uploadFile(file, 'e-commerce/categories')

        // Create new category 
        const category = await this.prisma.category.create({
            data: { name, image: result.url },
        });

        return category;
    }

    async getAllCategories() {
        const prices = await this.prisma.product.aggregate({
            _max: {
                price: true
            },
            _min: {
                price: true
            }
        })
        const categories = await this.prisma.category.findMany();
        return {
            minPrice: prices._min.price ?? 0,
            maxPrice: prices._max.price ?? 0,
            categories
        }
    }

    async getCategoryById(id: string) {
        return this.prisma.category.findUnique({
            where: { id },
        });
    }
}
