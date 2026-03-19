import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminCategoryService {

    constructor(
        private readonly prisma: PrismaService,
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



}
