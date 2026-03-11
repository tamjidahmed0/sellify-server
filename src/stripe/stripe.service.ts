import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(
        private configService: ConfigService,
        private readonly prisma: PrismaService

    ) {
        this.stripe = new Stripe(
            this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
        );
    }

    // Payment Intent create 
    async createPaymentIntent(id: string) {


        const order = await this.prisma.cart.findFirst({
            where: { userId: id },
            include: {
                items: true
            }

        });

        console.log(order, 'from order')

        if (!order || !order.items || order.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const productIds = order.items.map(item => item.productId);

        console.log(productIds)



        // total price calculate
        const totalPrice = order?.items.reduce((sum, item) => {
            return sum + Number(item.price) * item.quantity;
        }, 0);

        console.log(totalPrice)



        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: totalPrice ? totalPrice * 100 : 0,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                // userId: id,
                // productIds: JSON.stringify({productIds}),
                data: JSON.stringify({
                    items: productIds,
                    userId: id
                })
            }


        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }

    // Webhook verify
    constructEvent(payload: Buffer, signature: string) {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET'),
        );
    }
}