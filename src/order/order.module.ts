import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [OrderService],
  exports:[OrderService]
})
export class OrderModule { }
