import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import { EmailService } from 'src/common/utils/mailing/email.service';
import { User, UserSchema } from 'src/modules/schemas';
import { MentorCredential, MentorCredentialSchema } from 'src/modules/schemas/mentor-credential.schema';
import { MentorCredentialController } from '../controllers/mentor-credential.controller';
import { MentorCredentialService } from '../services/mentor-credential.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MentorCredential.name, schema: MentorCredentialSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LoggerModule,
  ],
  controllers: [MentorCredentialController],
  providers: [MentorCredentialService, EmailService],
  exports: [MentorCredentialService],
})
export class MentorCredentialModule {}
