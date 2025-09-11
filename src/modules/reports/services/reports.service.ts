import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder, Document } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { 
  User, 
  UserDocument,
  School,
  Challenge,
  ChallengeDocument
} from '../../schemas';
import { 
  StudentActivity, 
  StudentActivityDocument,
  ActivityStatus,
  ActivityType
} from '../../schemas/student-activity.schema';
import { 
  MentorSession, 
  MentorSessionDocument,
  SessionStatus
} from '../../schemas/mentor-session.schema';
import { 
  Achievement, 
  AchievementDocument 
} from '../../schemas/achievement.schema';
import {
  StudentAchievement,
  StudentAchievementDocument
} from '../../schemas/student-achievement.schema';
import { 
  StudentActivityFilterDto,
  StudentActivityReportDto,
  MentorSessionReportDto,
  StudentAchievementReportDto,
  StudentProgressReportDto,
  SchoolProgressReportDto,
  AdminDashboardReportDto
} from '../dtos';
import { AdminReportsFilterDto, AdminReportTimeframe } from '../dtos/admin-reports-filter.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(School.name) private schoolModel: Model<School & Document>,
    @InjectModel(Challenge.name) private challengeModel: Model<ChallengeDocument>,
    @InjectModel(StudentActivity.name) private studentActivityModel: Model<StudentActivityDocument>,
    @InjectModel(MentorSession.name) private mentorSessionModel: Model<MentorSessionDocument>,
    @InjectModel(Achievement.name) private achievementModel: Model<AchievementDocument>,
    @InjectModel(StudentAchievement.name) private studentAchievementModel: Model<StudentAchievementDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ReportsService');
  }

  async getStudentActivities(studentId: string, filterDto: StudentActivityFilterDto) {
    try {
      const query: any = { student: new Types.ObjectId(studentId) };
      
      // Apply filters
      if (filterDto.activityType && filterDto.activityType !== 'all') {
        query.activityType = filterDto.activityType;
      }
      
      if (filterDto.status && filterDto.status !== 'all') {
        query.status = filterDto.status;
      }
      
      if (filterDto.startDate) {
        query.createdAt = { $gte: new Date(filterDto.startDate) };
      }
      
      if (filterDto.endDate) {
        if (query.createdAt) {
          query.createdAt.$lte = new Date(filterDto.endDate);
        } else {
          query.createdAt = { $lte: new Date(filterDto.endDate) };
        }
      }

      const sort = { createdAt: filterDto.sortOrder === 'asc' ? 1 : -1 } as { [key: string]: SortOrder };
      
      // Get activities and populate related data
      const activities = await this.studentActivityModel.find(query)
        .sort(sort)
        .populate({
          path: 'activityId',
          select: 'title description type difficultyLevel estimatedTime ageRange',
        })
        .lean();

      return activities;
    } catch (error) {
      this.logger.error(`Error fetching student activities: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStudentMentorRatings(studentId: string, filterDto: StudentActivityFilterDto) {
    try {
      const query: any = { 
        student: new Types.ObjectId(studentId),
        status: SessionStatus.COMPLETED,
        mentorRating: { $exists: true }
      };
      
      if (filterDto.startDate) {
        query.completedAt = { $gte: new Date(filterDto.startDate) };
      }
      
      if (filterDto.endDate) {
        if (query.completedAt) {
          query.completedAt.$lte = new Date(filterDto.endDate);
        } else {
          query.completedAt = { $lte: new Date(filterDto.endDate) };
        }
      }

      const sort = { completedAt: filterDto.sortOrder === 'asc' ? 1 : -1 } as { [key: string]: SortOrder };
      
      // Get mentor sessions with ratings
      const sessions = await this.mentorSessionModel.find(query)
        .sort(sort)
        .populate({
          path: 'mentor',
          select: 'firstName lastName imageUrl',
        })
        .select('mentor scheduledAt endedAt durationMinutes topic mentorRating mentorFeedback')
        .lean();

      // Calculate average rating
      const totalRating = sessions.reduce((sum, session) => sum + session.mentorRating, 0);
      const averageRating = sessions.length > 0 ? totalRating / sessions.length : 0;

      return {
        sessions,
        stats: {
          totalSessions: sessions.length,
          averageRating
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching student mentor ratings: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStudentSessionLogs(studentId: string, filterDto: StudentActivityFilterDto) {
    try {
      const query: any = { student: new Types.ObjectId(studentId) };
      
      if (filterDto.startDate) {
        query.scheduledAt = { $gte: new Date(filterDto.startDate) };
      }
      
      if (filterDto.endDate) {
        if (query.scheduledAt) {
          query.scheduledAt.$lte = new Date(filterDto.endDate);
        } else {
          query.scheduledAt = { $lte: new Date(filterDto.endDate) };
        }
      }

      const sort = { scheduledAt: filterDto.sortOrder === 'asc' ? 1 : -1 } as { [key: string]: SortOrder };
      
      // Get all session logs
      const sessions = await this.mentorSessionModel.find(query)
        .sort(sort)
        .populate({
          path: 'mentor',
          select: 'firstName lastName imageUrl',
        })
        .lean();

      // Calculate session statistics
      const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED);
      const cancelledSessions = sessions.filter(s => s.status === SessionStatus.CANCELLED);
      const noShowSessions = sessions.filter(s => s.status === SessionStatus.NO_SHOW);
      const upcomingSessions = sessions.filter(s => s.status === SessionStatus.SCHEDULED);
      
      const totalHours = completedSessions.reduce((sum, session) => {
        return sum + (session.durationMinutes || 0) / 60;
      }, 0);

      return {
        sessions,
        stats: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          cancelledSessions: cancelledSessions.length,
          noShowSessions: noShowSessions.length,
          upcomingSessions: upcomingSessions.length,
          totalHours
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching student session logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStudentAchievements(studentId: string, filterDto: StudentActivityFilterDto) {
    try {
      const query: any = { student: new Types.ObjectId(studentId) };
      
      if (filterDto.startDate) {
        query.awardedAt = { $gte: new Date(filterDto.startDate) };
      }
      
      if (filterDto.endDate) {
        if (query.awardedAt) {
          query.awardedAt.$lte = new Date(filterDto.endDate);
        } else {
          query.awardedAt = { $lte: new Date(filterDto.endDate) };
        }
      }

      const sort = { awardedAt: filterDto.sortOrder === 'asc' ? 1 : -1 } as { [key: string]: SortOrder };
      
      // Get all achievements
      const studentAchievements = await this.studentAchievementModel.find(query)
        .sort(sort)
        .populate({
          path: 'achievement',
          select: 'name description type iconUrl badgeUrl pointsAwarded',
        })
        .lean();

      // Calculate total points
      const totalPoints = studentAchievements.reduce((sum, sa) => {
        const achievement = sa.achievement as any;
        return sum + (achievement?.pointsAwarded || 0);
      }, 0);

      return {
        achievements: studentAchievements,
        stats: {
          totalAchievements: studentAchievements.length,
          totalPoints
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching student achievements: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAdminLearningHours(filterDto: AdminReportsFilterDto) {
    try {
      const matchStage: any = {};
      
      if (filterDto.startDate) {
        matchStage.completedAt = { $gte: new Date(filterDto.startDate) };
      }
      
      if (filterDto.endDate) {
        if (matchStage.completedAt) {
          matchStage.completedAt.$lte = new Date(filterDto.endDate);
        } else {
          matchStage.completedAt = { $lte: new Date(filterDto.endDate) };
        }
      }
      
      matchStage.status = ActivityStatus.COMPLETED;

      let timeframeFormat: string;
      switch (filterDto.timeframe) {
        case AdminReportTimeframe.DAILY:
          timeframeFormat = '%Y-%m-%d';
          break;
        case AdminReportTimeframe.WEEKLY:
          timeframeFormat = '%Y-W%U';
          break;
        case AdminReportTimeframe.MONTHLY:
          timeframeFormat = '%Y-%m';
          break;
        case AdminReportTimeframe.QUARTERLY:
          timeframeFormat = '%Y-Q%q';
          break;
        case AdminReportTimeframe.YEARLY:
        default:
          timeframeFormat = '%Y';
          break;
      }

      // Aggregate learning hours
      const learningHours = await this.studentActivityModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              timeframe: { $dateToString: { format: timeframeFormat, date: '$completedAt' } },
              activityType: '$activityType'
            },
            totalMinutes: { $sum: '$timeSpentMinutes' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.timeframe',
            activities: {
              $push: {
                type: '$_id.activityType',
                minutes: '$totalMinutes',
                count: '$count'
              }
            },
            totalMinutes: { $sum: '$totalMinutes' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get mentor session hours
      const mentorSessionHours = await this.mentorSessionModel.aggregate([
        { 
          $match: { 
            status: SessionStatus.COMPLETED,
            ...(filterDto.startDate && { completedAt: { $gte: new Date(filterDto.startDate) } }),
            ...(filterDto.endDate && { completedAt: { $lte: new Date(filterDto.endDate) } })
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: timeframeFormat, date: '$completedAt' } },
            totalMinutes: { $sum: '$durationMinutes' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate overall stats
      const totalLearningMinutes = learningHours.reduce((sum, period) => sum + period.totalMinutes, 0);
      const totalMentorMinutes = mentorSessionHours.reduce((sum, period) => sum + period.totalMinutes, 0);
      const totalMinutes = totalLearningMinutes + totalMentorMinutes;
      
      return {
        learningHours,
        mentorSessionHours,
        stats: {
          totalHours: totalMinutes / 60,
          learningHours: totalLearningMinutes / 60,
          mentorSessionHours: totalMentorMinutes / 60
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching admin learning hours: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAdminSkillsMastery(filterDto: AdminReportsFilterDto) {
    try {
      // Implement skills mastery report
      // This is a placeholder for the actual implementation
      return {
        skillsMastery: [],
        stats: {
          totalSkills: 0,
          averageMasteryLevel: 0
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching admin skills mastery: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAdminSchoolsReport(filterDto: AdminReportsFilterDto) {
    try {
      // Get active schools
      const schools = await this.schoolModel.find({ isActive: true })
        .select('name address contactEmail students')
        .sort({ students: -1 })
        .limit(filterDto.limit)
        .lean();

      // Calculate total students across all schools
      const totalSchools = await this.schoolModel.countDocuments({ isActive: true });
      const totalStudents = schools.reduce((sum, school) => sum + (school.students?.length || 0), 0);
      
      // Count mentors
      const mentors = await this.userModel.countDocuments({ role: 'mentor' });
      
      // Count subscriptions
      const subscriptions = await this.schoolModel.countDocuments({ status: 'active' });

      return {
        schools,
        stats: {
          totalSchools,
          totalStudents,
          totalMentors: mentors,
          totalSubscriptions: subscriptions
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching admin schools report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAdminStudentsReport(filterDto: AdminReportsFilterDto) {
    try {
      // Aggregate student engagement metrics
      const activeStudents = await this.userModel.countDocuments({ 
        role: 'student',
        lastLoginAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
      });

      const totalStudents = await this.userModel.countDocuments({ role: 'student' });
      
      const studentsByAgeGroup = await this.userModel.aggregate([
        { $match: { role: 'student' } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$age', 8] }, then: '5-8' },
                  { case: { $lte: ['$age', 12] }, then: '9-12' },
                  { case: { $lte: ['$age', 16] }, then: '13-16' },
                ],
                default: '17+'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        activeStudents,
        totalStudents,
        studentsByAgeGroup,
        activityRate: totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0
      };
    } catch (error) {
      this.logger.error(`Error fetching admin students report: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAdminEngagementReport(filterDto: AdminReportsFilterDto) {
    try {
      // Calculate student engagement metrics
      const totalActivities = await this.studentActivityModel.countDocuments();
      
      const completedActivities = await this.studentActivityModel.countDocuments({
        status: ActivityStatus.COMPLETED
      });
      
      const activityCompletion = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
      
      // Get activity breakdown by type
      const activityByType = await this.studentActivityModel.aggregate([
        {
          $group: {
            _id: '$activityType',
            count: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', ActivityStatus.COMPLETED] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id',
            count: 1,
            completed: 1,
            completionRate: {
              $multiply: [
                { $divide: ['$completed', { $cond: [{ $eq: ['$count', 0] }, 1, '$count'] }] },
                100
              ]
            }
          }
        }
      ]);

      return {
        totalActivities,
        completedActivities,
        activityCompletion,
        activityByType
      };
    } catch (error) {
      this.logger.error(`Error fetching admin engagement report: ${error.message}`, error.stack);
      throw error;
    }
  }
}
