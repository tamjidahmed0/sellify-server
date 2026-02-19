import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) { }

  //Get or Create Cart
  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  // Add to Cart
  async addToCart(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: {
          select: { stock: true }
        }
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (!product.inventory || product.inventory.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    // If already exists increase quantity
    if (existingItem) {
      if (existingItem.quantity + quantity > product.inventory.stock) {
        throw new BadRequestException('Not enough stock');
      }
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    }

    // Else create new item with snapshot
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        price: product.price,
        productName: product.name,
        image: product.image,
      },
    });
  }

  //  Get Cart with Items
  async getCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
              }
            }
          }
        },


      },
    });

    if (!cart) return { items: [], total: 0 };

    const total = cart.items.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    return { ...cart, total };
  }

  //  Remove item
  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prisma.cartItem.delete({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });
  }

  //  Update quantity
  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) throw new BadRequestException('Invalid quantity');

    const cart = await this.getOrCreateCart(userId);

    // Find cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      throw new BadRequestException('Cart item not found');
    }


    // Check inventory stock
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId: cartItem.productId },
      select: { stock: true },
    });

    if (!inventory || inventory.stock < quantity) {
      throw new BadRequestException(
        `Only ${inventory?.stock ?? 0} items available in stock`
      );
    }


    // Update quantity
    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });



  }

  //  Clear Cart
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: 'Cart cleared' };
  }
}
