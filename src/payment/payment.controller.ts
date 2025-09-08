import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { CardPaymentRequest, SubscriptionStatus, PaymentStatus } from 'src/common/interfaces';
import { Request, Response } from 'express';
import { LoggerService } from 'src/common/logger/logger.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: LoggerService,
  ) {}
  
  @Post('/flutterwave/webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const event = req.body;

    const flutterwaveSecretHash = process.env.FLUTTERWAVE_HASH;
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== flutterwaveSecretHash) {
      console.warn('⚠️ Invalid Flutterwave signature');
      return res.status(401).send('Invalid signature');
    }

    await this.paymentService.processWebhook(event);

    return res.sendStatus(200);
  }

  // For testing purposes only - should be removed in production
  @Post('/test/mark-as-paid/:transactionRef')
  async markAsPaid(@Param('transactionRef') transactionRef: string) {
    return this.paymentService.manuallyMarkAsPaid(transactionRef);
  }

  // Verify transaction by ID
  @Get('/verify-transaction/:transactionId/:childTempId')
  async verifyTransaction(
    @Param('transactionId') transactionId: string,
    @Param('childTempId') childTempId: string,
  ) {
    try {
      // First verify with Flutterwave
      const verified = await this.paymentService.verifyPayment(transactionId);
      
      if (verified) {
        // Find subscription by childTempId
        const subscription = await this.subscriptionService.findSubscriptionByChildTempId(childTempId);
        
        if (!subscription) {
          return { 
            success: false, 
            message: 'Subscription not found'
          };
        }
        
        // Check if this transaction was already processed
        if (subscription.flutterwaveTransactionId === transactionId && 
            subscription.status === SubscriptionStatus.ACTIVE) {
          this.logger.log(`Transaction ${transactionId} was already processed for subscription ${subscription._id}`);
          return { 
            success: true, 
            message: 'Payment already verified and subscription activated',
            subscription
          };
        }
        
        // Update subscription with transaction ID
        subscription.flutterwaveTransactionId = transactionId;
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.isActive = true;
        subscription.paymentStatus = PaymentStatus.COMPLETED;
        
        // Calculate start and end dates
        const { startDate, endDate } = this.paymentService.calculateExpiration();
        
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        
        await subscription.save();
        
        return { 
          success: true, 
          message: 'Payment verified and subscription activated',
          subscription
        };
      }
      
      return { 
        success: false, 
        message: 'Payment verification failed'
      };
    } catch (error) {
      console.error(`Error verifying transaction: ${error.message}`, error.stack);
      return { 
        success: false, 
        message: 'Error verifying payment',
        error: error.message
      };
    }
  }
}
