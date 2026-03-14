import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSlideDto } from './dto/create-slide.dto';

@Injectable()
export class SlidesService {
    constructor(
        private readonly prisma: PrismaService,
        private cloudinary: CloudinaryService
    ) { }


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

    async getAllSlides() {
        return this.prisma.slide.findMany();
    }

}
