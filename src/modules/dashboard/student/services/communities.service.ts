import { Injectable } from '@nestjs/common';
import { CommunityService } from 'src/modules/community/services/community.service';
import { FilterCommunityDto } from 'src/modules/community/dtos';

@Injectable()
export class StudentCommunitiesService {
  constructor(private readonly communityService: CommunityService) {}

  async getAllCommunities(filterDto: FilterCommunityDto) {
    return this.communityService.getAllCommunities(filterDto);
  }

  async getUserCommunities(userId: string) {
    return this.communityService.getUserCommunities(userId);
  }

  async getCommunityDetails(communityId: string) {
    return this.communityService.getCommunityById(communityId);
  }

  async joinCommunity(communityId: string, userId: string) {
    return this.communityService.joinCommunity(communityId, userId);
  }

  async leaveCommunity(communityId: string, userId: string) {
    return this.communityService.leaveCommunity(communityId, userId);
  }
}
