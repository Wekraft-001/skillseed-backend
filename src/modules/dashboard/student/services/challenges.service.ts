import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';

@Injectable()
export class StudentChallengesService {
  constructor(private readonly contentService: ContentService) {}

  async getChallenges(userId: string, filterDto: FilterContentDto) {
    return this.contentService.getChallengesForStudent(userId, filterDto);
  }

  async getChallengeById(challengeId: string) {
    return this.contentService.getChallengeById(challengeId);
  }
}
