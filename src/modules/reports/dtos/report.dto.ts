import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ActivityStatus, ActivityType } from './student-activity-filter.dto';

export class StudentActivityReportDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  activityId: string;

  @ApiProperty({ example: 'Build a Solar Powered Car' })
  title: string;

  @ApiProperty({ enum: ActivityType, example: ActivityType.CHALLENGE })
  type: ActivityType;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.COMPLETED })
  status: ActivityStatus;

  @ApiProperty({ example: '2025-09-10T15:30:00.000Z' })
  startedAt: Date;

  @ApiProperty({ example: '2025-09-10T16:45:00.000Z' })
  completedAt?: Date;

  @ApiProperty({ example: 75 })
  progressPercentage: number;

  @ApiProperty({ example: 85 })
  score?: number;

  @ApiProperty({ example: 45 })
  timeSpentMinutes: number;
}

export class MentorSessionReportDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  sessionId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  mentorId: string;

  @ApiProperty({ example: 'Dr. Jane Smith' })
  mentorName: string;

  @ApiProperty({ example: 'Robotics Guidance' })
  sessionTopic: string;

  @ApiProperty({ example: '2025-09-11T14:00:00.000Z' })
  sessionDate: Date;

  @ApiProperty({ example: 30 })
  durationMinutes: number;

  @ApiProperty({ example: 4.5 })
  rating: number;

  @ApiProperty({ example: 'Very helpful session on programming the robot sensors.' })
  feedback?: string;
}

export class StudentAchievementReportDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439014' })
  achievementId: string;

  @ApiProperty({ example: 'Master Builder' })
  title: string;

  @ApiProperty({ example: 'Completed 10 engineering challenges' })
  description: string;

  @ApiProperty({ example: '2025-09-12T10:15:00.000Z' })
  earnedAt: Date;

  @ApiProperty({ example: 'https://example.com/badges/master-builder.png' })
  badgeUrl: string;

  @ApiProperty({ example: 100 })
  pointsEarned: number;
}

export class StudentProgressReportDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439015' })
  studentId: string;

  @ApiProperty({ example: 'Alex Johnson' })
  studentName: string;

  @ApiProperty({ type: [StudentActivityReportDto] })
  @Type(() => StudentActivityReportDto)
  activities: StudentActivityReportDto[];

  @ApiProperty({ type: [MentorSessionReportDto] })
  @Type(() => MentorSessionReportDto)
  mentorSessions: MentorSessionReportDto[];

  @ApiProperty({ type: [StudentAchievementReportDto] })
  @Type(() => StudentAchievementReportDto)
  achievements: StudentAchievementReportDto[];

  @ApiProperty({ example: 42 })
  totalActivitiesCompleted: number;

  @ApiProperty({ example: 15 })
  totalMentorSessionsAttended: number;

  @ApiProperty({ example: 8 })
  totalAchievementsEarned: number;

  @ApiProperty({ example: 1250 })
  totalPointsEarned: number;

  @ApiProperty({ example: 87 })
  averageScore: number;
}

export class SchoolProgressReportDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439016' })
  schoolId: string;

  @ApiProperty({ example: 'Westlake Academy' })
  schoolName: string;

  @ApiProperty({ example: 120 })
  totalStudents: number;

  @ApiProperty({ example: 85 })
  activeStudents: number;

  @ApiProperty({ example: 3250 })
  totalActivitiesCompleted: number;

  @ApiProperty({ example: 450 })
  totalMentorSessionsAttended: number;

  @ApiProperty({ example: 650 })
  totalAchievementsEarned: number;

  @ApiProperty({ example: 78500 })
  totalPointsEarned: number;

  @ApiProperty({ example: 82 })
  averageStudentScore: number;

  @ApiProperty({ example: [
    { category: 'Science', count: 1250 },
    { category: 'Technology', count: 950 },
    { category: 'Engineering', count: 750 },
    { category: 'Mathematics', count: 300 }
  ]})
  activitiesByCategory: { category: string; count: number }[];

  @ApiProperty({ example: [
    { month: 'January', count: 250 },
    { month: 'February', count: 280 },
    { month: 'March', count: 310 }
  ]})
  activityTrendByMonth: { month: string; count: number }[];
}

export class AdminDashboardReportDto {
  @ApiProperty({ example: 25 })
  totalSchools: number;

  @ApiProperty({ example: 2500 })
  totalStudents: number;

  @ApiProperty({ example: 75 })
  totalMentors: number;

  @ApiProperty({ example: 12500 })
  totalActivitiesCompleted: number;

  @ApiProperty({ example: 1850 })
  totalMentorSessionsAttended: number;

  @ApiProperty({ example: [
    { school: 'Westlake Academy', count: 1250 },
    { school: 'Eastwood High', count: 950 },
    { school: 'Northside Elementary', count: 750 }
  ]})
  topSchoolsByActivity: { school: string; count: number }[];

  @ApiProperty({ example: [
    { mentor: 'Dr. Jane Smith', count: 120, rating: 4.8 },
    { mentor: 'Prof. Michael Brown', count: 95, rating: 4.7 },
    { mentor: 'Dr. Sarah Johnson', count: 85, rating: 4.9 }
  ]})
  topMentorsBySession: { mentor: string; count: number; rating: number }[];

  @ApiProperty({ example: [
    { challenge: 'Build a Solar Powered Car', count: 350 },
    { challenge: 'Create a Weather Station', count: 275 },
    { challenge: 'Program a Game in Scratch', count: 230 }
  ]})
  topChallengesByCompletion: { challenge: string; count: number }[];

  @ApiProperty({ example: [
    { month: 'January', count: 950, students: 1200 },
    { month: 'February', count: 1050, students: 1350 },
    { month: 'March', count: 1200, students: 1500 }
  ]})
  activityTrendByMonth: { month: string; count: number; students: number }[];

  @ApiProperty({ example: [
    { category: 'Science', count: 4250 },
    { category: 'Technology', count: 3950 },
    { category: 'Engineering', count: 2750 },
    { category: 'Mathematics', count: 1550 }
  ]})
  activitiesByCategory: { category: string; count: number }[];
}
