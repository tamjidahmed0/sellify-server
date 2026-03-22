import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserAddressService {
    constructor(private readonly prisma: PrismaService) { }



    // GET all saved addresses for the logged-in user
    async getAddresses(userId: string) {
        return this.prisma.userAddress.findMany({
            where: { userId },
            orderBy: [
                { isDefault: 'desc' }, // default address comes first
                { createdAt: 'desc' },
            ],
        });
    }



    // POST — save a new address
    async saveAddress(userId: string, dto) {
        // If this address is being set as default, unset all existing defaults
        if (dto.isDefault) {
            await this.prisma.userAddress.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        const address = await this.prisma.userAddress.create({
            data: { userId, ...dto },
        });

        return { success: true, id: address.id };
    }

    // DELETE — remove a saved address (only owner can delete)
    async deleteAddress(userId: string, addressId: string) {
        const existing = await this.prisma.userAddress.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) throw new NotFoundException('Address not found');

        await this.prisma.userAddress.delete({ where: { id: addressId } });
        return { success: true };
    }


    // PATCH — mark an address as default
    async setDefault(userId: string, addressId: string) {
        const existing = await this.prisma.userAddress.findFirst({
            where: { id: addressId, userId },
        });
        if (!existing) throw new NotFoundException('Address not found');

        await this.prisma.userAddress.updateMany({
            where: { userId },
            data: { isDefault: false },
        });
        await this.prisma.userAddress.update({
            where: { id: addressId },
            data: { isDefault: true },
        });

        return { success: true };
    }


}
