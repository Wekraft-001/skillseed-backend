import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  FlutterwavePaymentInitiationResponse,
  SubscriptionStatus,
  PaymentStatus,
} from 'src/common/interfaces';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription } from 'rxjs';
import { SubscriptionDocument } from 'src/modules/schemas/subscription.schema';
import { Model } from 'mongoose';
import { User } from 'src/modules/schemas';
import { ParentDashboardService } from 'src/modules/dashboard/parents/services/dashboard.service';
import { CreateStudentDto, TempStudentDataDto } from 'src/modules/auth/dtos';
import { Create } from 'sharp';

@Injectable()
export class PaymentService {
  private readonly flutterwaveUrl: string;
  private readonly secretKey: string;
  private readonly encryptionKey: string;
  private tempStudentsStore: Record<string, TempStudentDataDto> = {};

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
    @Inject(forwardRef(() => ParentDashboardService))
    private readonly parentDashboardService: ParentDashboardService,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {
    this.flutterwaveUrl = process.env.FLW_BASE_URL;
    this.secretKey = this.configService.get<string>('FLW_SECRET_KEY');
    this.encryptionKey = process.env.FLW_ENCRYPTIONKEY;
  }

  async createFlutterwaveCustomer(
    customerData: any,
  ): Promise<FlutterwavePaymentInitiationResponse> {
    try {
      const url = `${this.flutterwaveUrl}/payments`;
      const paymentData = {
        tx_ref: customerData.tx_ref,
        amount: customerData.amount || 0,
        currency: customerData.currency || 'USD',
        payment_options: customerData.payment_options || 'card',
        customer: {
          email: customerData.email,
          name: `${customerData.name.first} ${customerData.name.last}`,
          phonenumber: customerData.phonenumber,
        },
        redirect_url:
          customerData.redirect_url ||
          // `https://parents.wekraft.co/payment-success/${customerData.childTempId}`,
          `http://localhost:5173/payment-success/${customerData.childTempId}`,
      };

      this.logger.log(`Creating payment at: ${url}`);
      this.logger.log(
        `Payload >>>>>>>>>>>>>>>>>>: ${JSON.stringify(paymentData, null, 2)}`,
      );
      this.logger.log(
        `Headers: Authorization: Bearer ${this.secretKey?.substring(0, 20)}...`,
      );

      const response: AxiosResponse = await axios.post(url, paymentData, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'X-Trace-Id': crypto.randomUUID(),
          'X-Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (response.data.status !== 'success') {
        this.logger.error('Failed error response');
        throw new BadRequestException('Failed to initiate payment');
      }

      this.logger.log(
        `Payment initiated$$$$$$$$$$ : ${JSON.stringify(response.data.data)}`,
      );

      const customer = response.data;
      this.logger.log(`Customer created: ${JSON.stringify(customer)}`);

      return customer;
    } catch (error) {
      this.logger.error(
        'Flutterwave API Error:',
        JSON.stringify({
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        }),
      );
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  async createFlutterwaveVirtualAccount(
    customerData: any,
  ): Promise<FlutterwavePaymentInitiationResponse> {
    try {
      const url = `${this.flutterwaveUrl}/virtual-account-numbers`;
      const paymentData = {
        tx_ref: customerData.tx_ref,
        amount: customerData.amount,
        currency: customerData.currency,
        email: customerData.email,
        name: customerData.name,
        phonenumber: customerData.phonenumber,
        frequency: customerData.frequency || 'once',
        is_permanent: customerData.is_permanent || false,
        bvn: '',
        narration: `Payment for subscription ${customerData.tx_ref}`,
      };

      this.logger.log(`Creating virtual account at: ${url}`);
      this.logger.log(
        `Payload >>>>>>>>>>>>>>>>>>: ${JSON.stringify(paymentData, null, 2)}`,
      );
      this.logger.log(
        `Headers: Authorization: Bearer ${this.secretKey?.substring(0, 20)}...`,
      );

      const response: AxiosResponse = await axios.post(url, paymentData, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'X-Trace-Id': crypto.randomUUID(),
          'X-Idempotency-Key': crypto.randomUUID(),
        },
      });

      if (response.data.status !== 'success') {
        this.logger.error(
          'Failed to create virtual account',
          JSON.stringify(response.data),
        );
        throw new BadRequestException('Failed to create virtual account');
      }

      this.logger.log(
        `Virtual account created: ${JSON.stringify(response.data)}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Flutterwave API Error:',
        JSON.stringify({
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        }),
      );
      throw new BadRequestException('Failed to create virtual account');
    }
  }

  async processWebhook(event: any) {
    this.logger.debug(
      `📥 Received Flutterwave Webhook: ${JSON.stringify(event)}`,
    );

    const { event: eventType, data } = event;

    if (eventType === 'charge.completed') {
      const txRef = data.tx_ref;
      const status = data.status;

      if (status === 'successful') {
        this.logger.log(`✅ Payment successful for tx_ref: ${txRef}`);

        const subscription = await this.findSubscriptionByTxRef(txRef);
        if (subscription) {
          const { startDate, endDate } = this.calculateExpiration();

          // Update all required fields
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.paymentStatus = PaymentStatus.COMPLETED;
          subscription.isActive = true;
          subscription.startDate = startDate;
          subscription.endDate = endDate;
          subscription.flutterwaveTransactionId = data.id; // Store the transaction ID

          this.logger.log(
            `🔄 Updating subscription ${subscription._id} with payment data`,
          );
          await subscription.save();
          this.logger.log(`✅ Subscription updated successfully`);
        } else {
          this.logger.warn(`⚠️ No subscription found for tx_ref ${txRef}`);
        }
      } else {
        this.logger.warn(`❌ Payment failed for tx_ref: ${txRef}`);
      }
    } else {
      this.logger.log(`ℹ️ Ignored event type: ${eventType}`);
    }
  }

  async findSubscriptionByTxRef(txRef: string) {
    return await this.subscriptionModel.findOne({ transactionRef: txRef });
  }

  calculateExpiration(): { startDate: Date; endDate: Date } {
    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setMonth(endDate.getMonth() + 1);

    return { startDate, endDate };
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      const url = `${this.flutterwaveUrl}/transactions/${transactionId}`;

      this.logger.log(`Getting transaction details at: ${url}`);

      const response: AxiosResponse = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        this.logger.error('Failed to get transaction details', response.data);
        throw new BadRequestException('Failed to get transaction details');
      }

      this.logger.log(
        `Transaction details retrieved successfully: ${transactionId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error getting transaction details',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to get transaction details');
    }
  }

  // FOR TESTING ONLY: Manually mark a subscription as paid
  async manuallyMarkAsPaid(transactionRef: string) {
    try {
      const subscription = await this.subscriptionModel.findOne({
        transactionRef,
      });

      if (!subscription) {
        throw new NotFoundException(
          `No subscription found with transactionRef: ${transactionRef}`,
        );
      }

      const { startDate, endDate } = this.calculateExpiration();

      // Update all required fields
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.paymentStatus = PaymentStatus.COMPLETED;
      subscription.isActive = true;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.flutterwaveTransactionId = `manual-${Date.now()}`; // Create a manual ID

      await subscription.save();

      this.logger.log(
        `Manually marked subscription ${subscription._id} as paid`,
      );
      return subscription;
    } catch (error) {
      this.logger.error(
        `Error manually marking subscription as paid: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Verify a Flutterwave payment transaction
   * @param transactionId The Flutterwave transaction ID to verify
   * @returns The transaction details if verified successfully
   */
  async verifyPayment(transactionId: string) {
    try {
      const url = `${this.flutterwaveUrl}/transactions/${transactionId}/verify`;

      this.logger.log(`Verifying payment at: ${url}`);

      const response: AxiosResponse = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if the transaction was successful
      if (
        response.data.status === 'success' &&
        response.data.data &&
        response.data.data.status === 'successful'
      ) {
        this.logger.log(
          `Payment verified successfully: ${transactionId}, Amount: ${response.data.data.amount}, Currency: ${response.data.data.currency}`,
        );
        return response.data.data;
      } else {
        this.logger.warn(
          `Payment verification failed for transaction ${transactionId}: ${JSON.stringify(response.data)}`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        'Error verifying payment:',
        JSON.stringify({
          transactionId,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        }),
      );
      throw new BadRequestException('Failed to verify payment');
    }
  }
}
