import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/modules/schemas';
import {
  Subscription,
  SubscriptionDocument,
} from 'src/modules/schemas/subscription.schema';
import { EmailService } from 'src/common/utils/mailing/email.service';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class SubscriptionExpiryScheduler {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Runs every day at 08:00 UTC.
   * 1. Finds subscriptions that expired in the last 24 hours → emails parent.
   * 2. Finds subscriptions expiring in exactly 3 days → sends warning email.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleSubscriptionExpiry(): Promise<void> {
    this.logger.log('Running subscription expiry check...');

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // ── 1. Notify parents of subscriptions that expired yesterday ────────────
    await this.notifyExpired(yesterday, today);

    // ── 2. Warn parents of subscriptions expiring in 3 days ─────────────────
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysEnd = new Date(in3Days);
    in3DaysEnd.setHours(23, 59, 59, 999);

    await this.warnUpcoming(in3Days, in3DaysEnd);

    this.logger.log('Subscription expiry check complete.');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async notifyExpired(from: Date, to: Date): Promise<void> {
    const expiredSubs = await this.subscriptionModel
      .find({
        isActive: true,
        endDate: { $gte: from, $lt: to },
      })
      .populate<{ child: UserDocument }>('child')
      .exec();

    this.logger.log(`Found ${expiredSubs.length} newly expired subscriptions`);

    for (const sub of expiredSubs) {
      try {
        // Mark subscription as inactive
        sub.isActive = false;
        await sub.save();

        const child = sub.child as UserDocument | null;
        if (!child) continue;

        // Fetch parent
        const parent = await this.userModel
          .findOne({
            role: UserRole.PARENT,
            $or: [
              { _id: (child as any).parent },
              { _id: (child as any).createdBy },
            ],
          })
          .lean()
          .exec();

        if (!parent) {
          this.logger.warn(`No parent found for child ${child._id}`);
          continue;
        }

        await this.emailService.sendSubscriptionExpiredEmail(
          parent.email,
          parent.firstName,
          `${child.firstName} ${child.lastName}`,
        );

        this.logger.log(
          `Sent expiry email to ${parent.email} for child ${child.firstName}`,
        );
      } catch (err) {
        this.logger.error(
          `Error processing expired sub ${sub._id}: ${err.message}`,
        );
      }
    }
  }

  private async warnUpcoming(from: Date, to: Date): Promise<void> {
    const upcomingSubs = await this.subscriptionModel
      .find({
        isActive: true,
        endDate: { $gte: from, $lte: to },
      })
      .populate<{ child: UserDocument }>('child')
      .exec();

    this.logger.log(
      `Found ${upcomingSubs.length} subscriptions expiring in ~3 days`,
    );

    for (const sub of upcomingSubs) {
      try {
        const child = sub.child as UserDocument | null;
        if (!child) continue;

        const parent = await this.userModel
          .findOne({
            role: UserRole.PARENT,
            $or: [
              { _id: (child as any).parent },
              { _id: (child as any).createdBy },
            ],
          })
          .lean()
          .exec();

        if (!parent) continue;

        const expiryDate = sub.endDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        await this.emailService.sendSubscriptionExpiryWarningEmail(
          parent.email,
          parent.firstName,
          `${child.firstName} ${child.lastName}`,
          expiryDate,
        );

        this.logger.log(
          `Sent expiry warning to ${parent.email} for child ${child.firstName} (expires ${expiryDate})`,
        );
      } catch (err) {
        this.logger.error(
          `Error processing upcoming expiry sub ${sub._id}: ${err.message}`,
        );
      }
    }
  }
}
