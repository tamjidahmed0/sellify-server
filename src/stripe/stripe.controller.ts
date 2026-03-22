import { Controller, Post, Headers, Req, BadRequestException, UseGuards, Body } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { OrderService } from 'src/order/order.service';




@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private order: OrderService

  ) { }


  // Payment Intent endpoint
  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  async createPaymentIntent(
    @Req() req,
    @Body('address') address,
  ) {
    return this.stripeService.createPaymentIntent(req.user.id, address);
  }


  //webhook payment confirmation
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    if (!req.rawBody) throw new BadRequestException('No request body');



    try {
      const event = this.stripeService.constructEvent(req.rawBody, signature);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;

        const { items, userId, address } = JSON.parse(paymentIntent.metadata.data);

        await this.order.createOrder(items, userId, address)

      }

      return { received: true };
    } catch (error) {
      console.log(error)
    }



  }





}