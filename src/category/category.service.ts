import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) { }

    async createCategory(name: string) {
        // Check if category already exists
        const existing = await this.prisma.category.findFirst({
            where: { name },
        });

        if (existing) {
            throw new BadRequestException(`Category "${name}" already exists`);
        }

        // Create new category 
        const category = await this.prisma.category.create({
            data: { name },
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
