import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto, FilterContentWithoutCategoryDto } from 'src/modules/content/dtos';
import { ContentCategory } from 'src/modules/content/dtos/create-content.dto';

@Injectable()
export class SchoolContentService {
  constructor(private readonly contentService: ContentService) {}

  async getContent(userId: string, filterDto: FilterContentWithoutCategoryDto) {
    // Convert to FilterContentDto with default category
    const fullFilterDto: FilterContentDto = {
      ...filterDto,
      category: ContentCategory.GENERAL
    };
    return this.contentService.getContentForUser(userId, fullFilterDto);
  }
}
