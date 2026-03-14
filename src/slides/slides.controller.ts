import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateSlideDto } from './dto/create-slide.dto';

@Controller('slides')
export class SlidesController {
    constructor(private readonly slide: SlidesService) { }


    @Post('create')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/)) {
                    cb(null, true);
                } else {
                    cb(new Error('Only image allowed'), false);
                }
            },
        }),
    )
    async createSlides(@Body() dto: CreateSlideDto, @UploadedFile() file: Express.Multer.File) {

        return this.slide.createSlides(dto, file)

    }

    @Get()
    async getAllslides() {
        return this.slide.getAllSlides();
    }


}
