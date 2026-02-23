import { Controller, Get, Post, Body, Delete, Patch, Req, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) { }

  //  Get Cart 
  @Get()
  getCart(@Req() req) {
    console.log(req.user)
    return this.cartService.getCart(req.user.id);
  }

  //  Add to Cart
  @Post('add')
  addToCart(
    @Req() req,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.cartService.addToCart(
      req.user.id,
      body.productId,
      body.quantity,
    );
  }

  //  Remove item
  @Delete('remove/:id')
  removeItem(@Req() req, @Param('id') cartItemId: string) {
    return this.cartService.removeItem(req.user.id, cartItemId);
  }

  //  Update quantity
  @Patch('quantity')
  updateQuantity(
    @Req() req,
    @Body() body: { cartItemId: string; quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
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
