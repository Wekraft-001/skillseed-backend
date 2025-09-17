import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import {
  FilterContentDto,
  FilterContentWithoutCategoryDto,
} from 'src/modules/content/dtos';

@Injectable()
export class MentorLearningActivitiesService {
  constructor(private readonly contentService: ContentService) {}

  async getLearningActivities(
    userId: string,
    filterDto: FilterContentWithoutCategoryDto,
  ) {
    // Convert to FilterContentDto with default category
    const fullFilterDto: FilterContentDto = {
      ...filterDto,
    };
    return this.contentService.getContentForUser(userId, fullFilterDto);
  }
}
