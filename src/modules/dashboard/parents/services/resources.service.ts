import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto, FilterContentWithoutCategoryDto } from 'src/modules/content/dtos';

@Injectable()
export class ParentResourcesService {
  constructor(private readonly contentService: ContentService) {}

  async getResources(userId: string, filterDto: FilterContentWithoutCategoryDto) {
    // Convert to standard filter DTO but without category
    const standardFilterDto: FilterContentDto = {
      type: filterDto.type,
      search: filterDto.search
    };
    
    return this.contentService.getContentForUser(userId, standardFilterDto);
  }
}
