import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';

@Injectable()
export class ParentLearningActivitiesService {
  constructor(private readonly contentService: ContentService) {}

  async getLearningActivities(userId: string, filterDto: FilterContentDto) {
    return this.contentService.getContentForUser(userId, filterDto);
  }
}
