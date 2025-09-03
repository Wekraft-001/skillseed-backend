import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'src/common/logger/logger.module';
import { EmailModule } from 'src/common/utils/mailing/email.module';
import { Mentor, MentorSchema, User, UserSchema } from 'src/modules/schemas';
import { MentorCredential, MentorCredentialSchema } from 'src/modules/schemas/mentor-credential.schema';
import { MentorCredentialController } from '../controllers/mentor-credential.controller';
import { MentorCredentialService } from '../services/mentor-credential.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MentorCredential.name, schema: MentorCredentialSchema },
      { name: User.name, schema: UserSchema },
      { name: Mentor.name, schema: MentorSchema },
    ]),
    LoggerModule,
    EmailModule,
  ],
  controllers: [MentorCredentialController],
  providers: [MentorCredentialService],
  exports: [MentorCredentialService],
})
export class MentorCredentialModule {}
