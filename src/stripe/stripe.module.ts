import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports : [PrismaModule, OrderModule],
  providers: [StripeService],
  controllers: [StripeController]
})
export class StripeModule {}
