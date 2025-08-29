import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';

@Injectable()
export class MentorResourcesService {
  constructor(private readonly contentService: ContentService) {}

  async getResources(userId: string, filterDto: FilterContentDto) {
    return this.contentService.getContentForUser(userId, filterDto);
  }
}
