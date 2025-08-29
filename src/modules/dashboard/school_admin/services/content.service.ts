import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';

@Injectable()
export class SchoolContentService {
  constructor(private readonly contentService: ContentService) {}

  async getContent(userId: string, filterDto: FilterContentDto) {
    return this.contentService.getContentForUser(userId, filterDto);
  }
}
