import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Subject } from 'rxjs';
import { log } from 'winston';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      auth: {
        user: process.env.MAIL_USER || 'api',
        pass: process.env.MAIL_PASS || '7f608d469e261486705539e674a462dd',
        authMethod: 'PLAIN,LOGIN',
      },
      tls: {
        rejectUnauthorized: process.env.MAIL_STARTTLS === 'true',
      },
      debug: true,
    });
    console.log('MAIL_USER:', process.env.MAIL_USER);
    console.log('MAIL_PASS:', process.env.MAIL_PASS);
  }

  async sendSchoolOnboardingEmail(email: string, password: string) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your Skillseed School Account',
      html: `
        <p>Hi there,</p>
        <p>Your school has been onboarded on Skillseed 🎉</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>You'll be asked to reset this password on first login.</p>
        <p>Welcome aboard!</p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  }

  async sendMentorOnboardingEmail(
    firstName: string,
    email: string,
    password: string,
  ) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Welcome to Skillseed – Your Mentor Account Details',
      html: `
      <p>Hi ${firstName},</p>
      <p>Welcome to <strong>Skillseed</strong>! 🎉 We're thrilled to have you join our mentorship network.</p>
    
      <p>Here are your login credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
    
      <p>You'll be prompted to reset your password the first time you log in to keep your account secure.</p>
    
      <p>As a mentor, you play a key role in shaping the experience of learners and supporting their growth. We're excited to see the impact you'll make!</p>
    
      <p>If you have any questions or need assistance, don’t hesitate to reach out to our support team.</p>
    
      <p>Let’s make learning meaningful,</p>
      <p><strong>The Skillseed Team</strong></p>
    `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  }
  async sendExpiredSubscriptionEmail(email: string, firstName: string) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your Subscription Has Expired',
      html: `
      <p>Hi ${firstName},</p>
      <p>We noticed that your subscription has expired as of today.</p>
      <p>If you'd like to renew and continue enjoying Skillseed, please log in to your account and update your payment details.</p>
      <p>Let us know if you need any help.</p>
      <p><strong>The Skillseed Team</strong></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Expiration email sent:', info.response)
      
    } catch (error) {
      console.log('❌ Failed to send expiration email:', error);
    }
  }

  async sendCredentialApprovedEmail(email: string, firstName: string, credentialType: string) {
    const credentialName = credentialType === 'government_id' ? 'Government ID' : 'Professional Credentials';
    
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your Credentials Have Been Approved',
      html: `
      <p>Hi ${firstName},</p>
      <p>Great news! Your ${credentialName} has been <strong>approved</strong> by our team.</p>
      <p>Your profile is now fully verified, which means you can access all mentor features on Skillseed.</p>
      <p>Thank you for your cooperation during the verification process.</p>
      <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p><strong>The Skillseed Team</strong></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Credential approval email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send credential approval email:', error);
    }
  }

  async sendCredentialRejectedEmail(email: string, firstName: string, credentialType: string, rejectionReason: string) {
    const credentialName = credentialType === 'government_id' ? 'Government ID' : 'Professional Credentials';
    
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Action Required: Your Credentials Were Not Approved',
      html: `
      <p>Hi ${firstName},</p>
      <p>We've reviewed your ${credentialName} and unfortunately, we were unable to approve it at this time.</p>
      <p><strong>Reason:</strong> ${rejectionReason || 'The submitted credentials did not meet our verification requirements.'}</p>
      <p>Please log in to your account and upload a new document that addresses the issues mentioned above.</p>
      <p>If you have any questions or need further clarification, please contact our support team for assistance.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,</p>
      <p><strong>The Skillseed Team</strong></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Credential rejection email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send credential rejection email:', error);
    }
  }

  async sendMentorSuspensionEmail(firstName: string, email: string) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your Skillseed Mentor Account Has Been Suspended',
      html: `
      <p>Hi ${firstName},</p>
      <p>We're writing to inform you that your Skillseed mentor account has been temporarily suspended.</p>
      <p>This suspension may be due to a policy violation, credential verification issue, or administrative review.</p>
      <p>If you believe this action was taken in error or would like to discuss the reinstatement of your account, please contact our support team at support@skillseed.com.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,</p>
      <p><strong>The Skillseed Team</strong></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentor suspension email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send mentor suspension email:', error);
    }
  }

  async sendMentorReactivationEmail(firstName: string, email: string) {
    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Good News! Your Skillseed Mentor Account Has Been Reactivated',
      html: `
      <p>Hi ${firstName},</p>
      <p>We're pleased to inform you that your Skillseed mentor account has been reactivated.</p>
      <p>You can now log in to your account and resume all mentor activities on the platform.</p>
      <p>Thank you for your patience during this process.</p>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Best regards,</p>
      <p><strong>The Skillseed Team</strong></p>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentor reactivation email sent:', info.response);
    } catch (error) {
      console.error('❌ Failed to send mentor reactivation email:', error);
    }
  }
}
