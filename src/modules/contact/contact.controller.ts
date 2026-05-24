import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { ContactFormDto } from './contact.dto';

@Controller('contact')
@ApiTags('CONTACT')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({
    summary: 'Submit the Wekraft website contact form',
    description:
      'Public endpoint — no authentication required. ' +
      'Sends an email to skillseed@wekraft.co and an auto-reply to the sender.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email sent successfully',
    schema: {
      example: {
        message:
          'Your message has been sent successfully. We will get back to you shortly.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — check required fields',
  })
  async submitContactForm(@Body() dto: ContactFormDto) {
    return this.contactService.sendContactEmail(dto);
  }
}
