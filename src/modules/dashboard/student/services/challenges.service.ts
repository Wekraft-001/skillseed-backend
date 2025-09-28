import { Injectable } from '@nestjs/common';
import { ContentService } from 'src/modules/content/services/content.service';
import { FilterContentDto } from 'src/modules/content/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompletedChallenge, CompletedChallengeDocument } from 'src/modules/schemas';

@Injectable()
export class StudentChallengesService {
  constructor(
    private readonly contentService: ContentService,
    @InjectModel(CompletedChallenge.name)
    private completedChallengeModel: Model<CompletedChallengeDocument>,
  ) {}

  async getChallenges(userId: string, filterDto: FilterContentDto) {
    const challenges = await this.contentService.getChallengesForStudent(userId, filterDto);
    
    // Get all completed challenges for this user
    const completedChallenges = await this.completedChallengeModel
      .find({ userId })
      .select('challengeId')
      .exec();
    
    // Create a Set of completed challenge IDs for faster lookup
    const completedChallengeIds = new Set(
      completedChallenges.map(cc => cc.challengeId.toString())
    );
    
    // Add completion status to each challenge
    return challenges.map(challenge => ({
      ...challenge.toObject(),
      isCompleted: completedChallengeIds.has(challenge._id.toString())
    }));
  }

  async getChallengeById(challengeId: string, userId?: string) {
    const challenge = await this.contentService.getChallengeById(challengeId);
    
    // If userId is provided, check if the user has completed this challenge
    if (userId) {
      const completedChallenge = await this.completedChallengeModel
        .findOne({ userId, challengeId })
        .exec();
      
      return {
        ...challenge.toObject(),
        isCompleted: !!completedChallenge
      };
    }
    
    return challenge;
  }
}
