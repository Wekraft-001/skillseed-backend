import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';

@Injectable()
export class SchoolChallengesService {
  constructor(private readonly contentService: ContentService) {}

  async getChallenges(userId: string, filterDto: FilterContentDto) {
    // This is a modified version of the students' challenge access
    // We're adapting it for school admins while reusing the content service
    return this.contentService.getChallengesForSchool(userId, filterDto);
  }

  async getChallengeById(challengeId: string) {
    return this.contentService.getChallengeById(challengeId);
  }
}
