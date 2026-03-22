import { Module } from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { UserAddressController } from './user-address.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports : [PrismaModule],
  providers: [UserAddressService],
  controllers: [UserAddressController]
})
export class UserAddressModule {}
