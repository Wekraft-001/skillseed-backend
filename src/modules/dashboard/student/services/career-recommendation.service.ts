import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  CareerRecommendation,
  CareerRecommendationDocument,
} from '../../../schemas';
import { CareerProfileSummary } from '../../parents/services/parent-child-overview.service';

export interface SaveRecommendationDto {
  userId: string;
  quizId: string;
  recommendationResult: Record<string, any>;
  quizAnalysis: Record<string, any> | null;
  quizCompletedAt: Date;
}

@Injectable()
export class CareerRecommendationService {
  constructor(
    @InjectModel(CareerRecommendation.name)
    private readonly careerRecModel: Model<CareerRecommendationDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CareerRecommendationService');
  }

  /**
   * Upserts the career recommendation for a student.
   * Safe to call multiple times — only one record per user is kept.
   */
  async saveRecommendation(
    dto: SaveRecommendationDto,
  ): Promise<CareerRecommendation> {
    const doc = await this.careerRecModel.findOneAndUpdate(
      { userId: new Types.ObjectId(dto.userId) },
      {
        $set: {
          quizId: new Types.ObjectId(dto.quizId),
          recommendationResult: dto.recommendationResult,
          quizAnalysis: dto.quizAnalysis,
          quizCompletedAt: dto.quizCompletedAt,
        },
      },
      { upsert: true, new: true },
    );

    this.logger.log(
      `Upserted career recommendation for user ${dto.userId} (doc: ${doc._id})`,
    );

    return doc;
  }

  async getRecommendationForUser(
    userId: string,
  ): Promise<CareerRecommendation | null> {
    return this.careerRecModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
  }

  async getCareerProfileSummary(userId: string): Promise<CareerProfileSummary> {
    const rec = await this.careerRecModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    if (!rec) {
      return {
        interests: [],
        skills: [],
        dreamJob: null,
        quizCompleted: false,
      };
    }

    const result: Record<string, any> = rec.recommendationResult ?? {};
    const analysis: Record<string, any> =
      rec.quizAnalysis ?? rec.quizAnalysis ?? {};
    const interests: string[] =
      analysis.topCareers ??
      (result.careers as any[])?.map((c: any) => c.career ?? c) ??
      [];
    const skills: string[] =
      analysis.aiAnalysis?.skills ??
      (result.traits as any[])?.map((t: any) => t.trait ?? t) ??
      [];
    const dreamJob: string | null =
      analysis.topCareerAreas?.[0] ??
      (result.careers as any[])?.[0]?.career ??
      null;

    return {
      interests,
      skills,
      dreamJob,
      quizCompleted: true,
    };
  }
}
