import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  credentialApprovedTemplate,
  credentialRejectedTemplate,
  mentorSuspensionTemplate,
  mentorReactivationTemplate,
  subscriptionExpiryWarningTemplate,
  schoolOnboardingTemplate,
  mentorOnboardingTemplate,
  studentOnboardingParentTemplate,
  studentOnboardingSchoolTemplate,
  subscriptionExpiredTemplate,
} from './template/index.template';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER || 'api',
        pass: process.env.MAIL_PASS,
        authMethod: 'PLAIN,LOGIN',
      } as any,
      tls: {
        rejectUnauthorized: process.env.MAIL_STARTTLS === 'true',
      },
    });
  }

  // ─── Private helper ────────────────────────────────────────────────────────

  private async send(
    to: string | string[],
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html,
      });
      console.log(
        `✅ Email sent to ${Array.isArray(to) ? to.join(', ') : to}: ${info.response}`,
      );
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
    }
  }

  // ─── Public methods ────────────────────────────────────────────────────────

  async sendSchoolOnboardingEmail(
    email: string,
    password: string,
  ): Promise<void> {
    await this.send(
      email,
      'Your Skillseed School Account',
      schoolOnboardingTemplate(email, password),
    );
  }

  async sendMentorOnboardingEmail(
    firstName: string,
    email: string,
    password: string,
  ): Promise<void> {
    await this.send(
      email,
      'Welcome to Skillseed – Your Mentor Account Details',
      mentorOnboardingTemplate(firstName, email, password),
    );
  }

  async sendStudentOnboardingEmailParent(
    parentEmail: string,
    studentName: string,
    password: string,
    username: string,
    dashboardUrl: string,
  ): Promise<void> {
    await this.send(
      parentEmail,
      `Welcome to Skillseed – ${studentName}'s Account Details`,
      studentOnboardingParentTemplate(
        studentName,
        username,
        password,
        dashboardUrl,
      ),
    );
  }

  async sendStudentOnboardingEmailSchool(
    parentEmail: string,
    adminEmail: string,
    studentName: string,
    username: string,
    password: string,
    dashboardUrl: string,
  ): Promise<void> {
    await this.send(
      [parentEmail, adminEmail],
      `Welcome to Skillseed – ${studentName}'s Account Details`,
      studentOnboardingSchoolTemplate(
        studentName,
        username,
        password,
        dashboardUrl,
      ),
    );
  }

  async sendSubscriptionExpiredEmail(
    parentEmail: string,
    parentFirstName: string,
    studentName: string,
    renewUrl = 'https://app.wekraft.co/parent/dashboard/subscriptions',
  ): Promise<void> {
    await this.send(
      parentEmail,
      `Action Required: ${studentName}'s Skillseed Subscription Has Expired`,
      subscriptionExpiredTemplate(parentFirstName, studentName, renewUrl),
    );
  }

  async sendSubscriptionExpiryWarningEmail(
    parentEmail: string,
    parentFirstName: string,
    studentName: string,
    expiryDate: string,
    renewUrl = 'https://app.wekraft.co/parent/dashboard/subscriptions',
  ): Promise<void> {
    await this.send(
      parentEmail,
      `Reminder: ${studentName}'s Skillseed Subscription Expires on ${expiryDate}`,
      subscriptionExpiryWarningTemplate(
        parentFirstName,
        studentName,
        expiryDate,
        renewUrl,
      ),
    );
  }

  async sendExpiredSubscriptionEmail(
    email: string,
    firstName: string,
  ): Promise<void> {
    // Legacy shim — delegates to the new method
    await this.sendSubscriptionExpiredEmail(email, firstName, 'your child');
  }

  async sendCredentialApprovedEmail(
    email: string,
    firstName: string,
    credentialType: string,
  ): Promise<void> {
    await this.send(
      email,
      'Your Credentials Have Been Approved',
      credentialApprovedTemplate(firstName, credentialType),
    );
  }

  async sendCredentialRejectedEmail(
    email: string,
    firstName: string,
    credentialType: string,
    rejectionReason: string,
  ): Promise<void> {
    await this.send(
      email,
      'Action Required: Your Credentials Were Not Approved',
      credentialRejectedTemplate(firstName, credentialType, rejectionReason),
    );
  }

  async sendMentorSuspensionEmail(
    firstName: string,
    email: string,
  ): Promise<void> {
    await this.send(
      email,
      'Your Skillseed Mentor Account Has Been Suspended',
      mentorSuspensionTemplate(firstName),
    );
  }

  async sendMentorReactivationEmail(
    firstName: string,
    email: string,
  ): Promise<void> {
    await this.send(
      email,
      'Good News! Your Skillseed Mentor Account Has Been Reactivated',
      mentorReactivationTemplate(firstName),
    );
  }
}
