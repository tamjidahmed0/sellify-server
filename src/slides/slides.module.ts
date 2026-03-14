import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';
import { SlidesController } from './slides.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports : [PrismaModule, CloudinaryModule],
  providers: [SlidesService],
  controllers: [SlidesController]
})
export class SlidesModule {}
