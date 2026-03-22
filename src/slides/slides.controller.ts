import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, Patch, Delete, UseGuards } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateSlideDto } from './dto/create-slide.dto';
import { SlideImageUploadInterceptor } from 'src/common/interceptors/image-upload.interceptor';
import { AdminJwtAuthGuard } from 'src/auth/guard/admin-jwt.guard';

@Controller('slides')
export class SlidesController {
    constructor(private readonly slide: SlidesService) { }


    @Post('create')
    @UseGuards(AdminJwtAuthGuard)
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


    // PATCH /slides/:id — update 
    @Patch(':id')
    @UseGuards(AdminJwtAuthGuard)
    @UseInterceptors(SlideImageUploadInterceptor)
    async updateSlide(
        @Param('id') id: string,
        @Body() dto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.slide.updateSlide(id, dto, file);
    }

    // DELETE /slides/:id
    @Delete(':id')
    @UseGuards(AdminJwtAuthGuard)
    async deleteSlide(@Param('id') id: string) {
        return this.slide.deleteSlide(id);
    }


    //preview when edit
    @Get(':id')
    @UseGuards(AdminJwtAuthGuard)
    async getSlideById(@Param('id') id: string) {
        return this.slide.getSlideById(id);
    }



    @Get('admin/slides')
    @UseGuards(AdminJwtAuthGuard)
    async getAdminSlides() {
        return this.slide.getAllSlides();
    }





    @Get()
    async getAllslides() {
        return this.slide.getAllSlides();
    }


}
