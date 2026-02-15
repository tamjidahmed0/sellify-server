import { Controller, Get, Post, Body, Delete, Patch, Req, Param } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  //  Get Cart 
  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart('1');
  }

  //  Add to Cart
  @Post('add')
  addToCart(
    @Req() req,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addToCart(
      '1',
      body.productId,
      body.quantity,
    );
  }

  //  Remove item
  @Delete('remove/:id')
  removeItem(@Req() req, @Param('id') cartItemId: string) {
    console.log(cartItemId)
    return this.cartService.removeItem('1', cartItemId);
  }

  //  Update quantity
  @Patch('quantity')
  updateQuantity(
    @Req() req,
    @Body() body: { cartItemId: string; quantity: number },
  ) {
    return this.cartService.updateQuantity(
      // req.user.id,
      '1',
      body.cartItemId,
      body.quantity,
    );
  }

  //  Clear cart
  @Delete('clear')
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
