import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { extractPublicId } from 'src/common/helper/cloudinary.helper';

@Injectable()
export class SlidesService {
    constructor(
        private readonly prisma: PrismaService,
        private cloudinary: CloudinaryService
    ) { }

    //private for admin
    async createSlides(dto: CreateSlideDto, file: Express.Multer.File) {

        const uploadResult = await this.cloudinary.uploadFile(file, 'e-commerce/sliders');
        const url = uploadResult.url;

        return this.prisma.slide.create({
            data: {
                ...dto,
                image: url
            }
        })

    }



    // UPDATE — for admin
    async updateSlide(id: string, dto, file?: Express.Multer.File) {
        const existing = await this.prisma.slide.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Slide not found');

        let imageUrl: string | undefined;

        if (file) {
            // Delete old image from Cloudinary before uploading new one
            const publicId = extractPublicId(existing.image);
            if (publicId) await this.cloudinary.deleteFile(publicId);

            const uploaded = await this.cloudinary.uploadFile(file, 'e-commerce/sliders');
            imageUrl = uploaded.url;
        }

        return this.prisma.slide.update({
            where: { id },
            data: {
                ...dto,
                ...(imageUrl && { image: imageUrl }),
            },
        });
    }

    // DELETE — deklete for admin
    async deleteSlide(id: string) {
        const existing = await this.prisma.slide.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Slide not found');

        // Delete image from Cloudinary
        const publicId = extractPublicId(existing.image);
        if (publicId) await this.cloudinary.deleteFile(publicId);

        await this.prisma.slide.delete({ where: { id } });
        return { success: true, message: 'Slide deleted successfully' };
    }

    // admin update preview
    async getSlideById(id: string) {
        const slide = await this.prisma.slide.findUnique({ where: { id } });
        if (!slide) throw new NotFoundException('Slide not found');
        return slide;
    }




    //public for main ecommerce
    async getAllSlides() {
        return this.prisma.slide.findMany();
    }

}
