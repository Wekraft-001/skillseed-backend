import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/common/utils/mailing/email.service';
import { ContactFormDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly emailService: EmailService) {}

  async sendContactEmail(dto: ContactFormDto): Promise<{ message: string }> {
    const fullName = [dto.firstName, dto.lastName].filter(Boolean).join(' ');

    // ── Email to Skillseed team ───────────────────────────────────────────
    await this.emailService.sendContactFormEmail({
      senderName: fullName,
      senderEmail: dto.email,
      phoneNumber: dto.phoneNumber,
      question: dto.question,
    });

    // ── Auto-reply to the person who submitted ────────────────────────────
    await this.emailService.sendContactAutoReply({
      toEmail: dto.email,
      firstName: dto.firstName,
    });

    return {
      message:
        'Your message has been sent successfully. We will get back to you shortly.',
    };
  }
}
