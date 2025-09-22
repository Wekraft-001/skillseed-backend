import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, CareerQuiz, EducationalContent } from 'src/modules/schemas';
import { LoggerService } from 'src/common/logger/logger.service';
import { AiService } from 'src/modules/ai/ai.service';
import { DashboardResponse } from 'src/common/interfaces';

@Injectable()
export class StudentDashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuiz>,
    @InjectModel(EducationalContent.name)
    private readonly eduContentModel: Model<EducationalContent>,
    private readonly logger: LoggerService,
    private readonly aiService: AiService,
  ) {}

  async getDashboardData(student: User): Promise<{
    dashboardResponse: DashboardResponse;
  }> {
    const completeUserData = await this.userModel.findById(student._id).exec();

    const [initialQuiz, recommendations] = await Promise.all([
      this.getInitialQuiz(student),
      this.getRecommendations(student),
    ]);

    return {
      dashboardResponse: {
        success: true,
        message: 'Student dashboard data retrieved successfully',
        timestamp: new Date().toISOString(),
        userId: student._id.toString(),
        quizzes: initialQuiz ? [initialQuiz] : [],
        educationalContents: recommendations || [],
        currentUser: completeUserData || student,
      },
    };
  }

  async getInitialQuiz(student: User): Promise<CareerQuiz | null> {
    // Check if student has an initial quiz assigned
    if (!student.initialQuizId) {
      return null;
    }

    // Get the quiz details
    const quiz = await this.quizModel.findById(student.initialQuizId);
    if (!quiz) {
      this.logger.warn(
        `Initial quiz ${student.initialQuizId} not found for student ${student._id}`,
      );
      return null;
    }

    return quiz;
  }

  async submitQuizAnswers(
    student: User,
    quizId: string,
    answers: { phaseIndex: number; questionIndex: number; answer: string }[],
  ) {
    // Use AI service to submit and analyze answers
    const result = await this.aiService.submitAnswers(
      { quizId, answers },
      student._id.toString(),
    );

    // Generate recommendations based on quiz results
    await this.generateRecommendations(student);

    return result;
  }

  async generateRecommendations(student: User) {
    try {
      // Generate new educational content recommendations
      const newContent = await this.aiService.generateEducationalContent(
        student._id.toString(),
      );

      // Save the new content and return the saved document
      return await this.eduContentModel.create({
        ...newContent,
        user: student._id,
      });
    } catch (error) {
      this.logger.warn(
        `Unable to generate recommendations for student ${student._id}: ${error.message}`,
      );
      // Return null to indicate no recommendations could be generated
      return null;
    }
  }

  async getRecommendations(student: User) {
    // Get existing recommendations or generate new ones
    let content = await this.eduContentModel
      .find({ user: student._id })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!content.length) {
      const newRec = await this.generateRecommendations(student);
      content = newRec ? [newRec] : [];
    }

    return content;
  }

  async getEducationalContent(
    contentId: string,
  ): Promise<EducationalContent | null> {
    return this.eduContentModel.findById(contentId).exec();
  }
}
