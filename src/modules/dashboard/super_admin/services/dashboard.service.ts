import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import {
  DashboardData,
  DashboardResponse,
  DashboardSummary,
  UserRole,
} from 'src/common/interfaces';
import {
  User,
  Category,
  CategoryDocument,
  UserDocument,
  Badge,
} from '../../../schemas';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { EducationalContent } from '../../../schemas/educational_content.schema';
import { ProjectShowcase } from '../../../schemas/showcase.schema';
import { CareerQuiz } from '../../../schemas/career-quiz.schema';
import { School } from '../../school_admin/schema/school.schema';
import { AiService } from 'src/modules/ai/ai.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,

    @InjectModel(EducationalContent.name)
    private readonly eduContentModel: Model<EducationalContent>,

    @InjectModel(Badge.name)
    private readonly badgeModel: Model<Badge>,

    @InjectModel(ProjectShowcase.name)
    private readonly projectShowcaseModel: Model<ProjectShowcase>,

    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuiz>,

    @InjectModel(School.name)
    private readonly schoolModel: Model<School>,

    private readonly aiService: AiService,
    private readonly logger: LoggerService,
  ) {}

  async getDashboardData(user: User): Promise<{
    dashboardResponse: DashboardResponse;
    summary: DashboardSummary;
  }> {
    try {
      this.logger.log(
        `Fetching dashboard data for user: ${user._id} with role: ${user.role}`,
      );

      const [data, summary] = await (() => {
        switch (user.role) {
          case UserRole.STUDENT:
            return Promise.all([
              this.getStudentDashboardData(user),
              this.getStudentSummary(user),
            ]);
          case UserRole.MENTOR:
            return Promise.all([
              this.getMentorDashboardData(user),
              this.getMentorSummary(user),
            ]);
          case UserRole.PARENT:
            return Promise.all([
              this.getParentDashboardData(user),
              this.getParentSummary(user),
            ]);
          case UserRole.SCHOOL_ADMIN:
            return Promise.all([
              this.getSchoolAdminDashboardData(user),
              this.getSchoolAdminSummary(user),
            ]);
          case UserRole.SUPER_ADMIN:
            return Promise.all([
              this.getSuperAdminDashboardData(user),
              this.getSuperAdminSummary(user),
            ]);
          default:
            throw new ForbiddenException('Invalid user role');
        }
      })();

      const dashboardResponse: DashboardResponse = {
        success: true,
        message: 'Dashboard data retrieved successfully',
        timestamp: new Date().toISOString(),
        userId: (user as any)._id,

        currentUser: user,
      };

      return {
        dashboardResponse,
        summary,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching dashboard data for user: ${user._id}`,
        error,
      );
      throw error;
    }
  }
  // ALL DASHBOARD DATA
  private async getSuperAdminDashboardData(user: User): Promise<DashboardData> {
    const [schools, students] = await Promise.all([
      this.schoolModel
        .find({ deletedAt: null })
        .populate('superAdmin', 'firstName lastName email role')
        .populate('createdBy', 'firstName lastName email role')
        .lean(),
      this.userModel
        .find({
          role: UserRole.STUDENT,
          deletedAt: null,
        })
        .populate('school', 'schoolName email logoUrl')
        .populate('createdBy', 'firstName lastName email role')
        .lean(),
    ]);

    return {
      schools,
      student: students,
      analytics: {
        totalSchools: schools.length,
        totalStudents: students.length,
      },
    };
  }

  private async getSuperAdminSummary(user: User): Promise<DashboardSummary> {
    const schoolCount = await this.schoolModel.countDocuments();
    const userCount = await this.userModel.countDocuments();
    return {
      totalSchools: schoolCount,
      totalUsers: userCount,
      // user: user as any,
    };
  }

  private async getStudentDashboardData(user: User): Promise<DashboardData> {
    const [educationalContents, badges] = await Promise.all([
      this.getEducationalContents(user),
      this.getStudentBadges(user),
    ]);

    return {
      educationalContents,
      badges,
    };
  }

  private async getEducationalContents(
    user: User,
  ): Promise<EducationalContent[]> {
    let content = await this.eduContentModel.find({ user: user._id });

    if (!content.length) {
      this.logger.log(
        `No educational content found for user: ${user._id.toString()}. Generating.. please wait...`,
      );

      // Generate the content data
      const newContentData = await this.aiService.generateEducationalContent(
        user._id.toString(), // Convert ObjectId to string for the AI service
      );

      // Create and save the document using the model
      const newContent = await this.eduContentModel.create({
        ...newContentData,
        user: user._id,
      });

      content = [newContent];
    }

    return content;
  }

  private async getStudentBadges(user: User): Promise<Badge[]> {
    return this.badgeModel.find({ user: user._id }).sort({ createdAt: -1 });
  }

  private async getStudentSummary(user: User): Promise<DashboardSummary> {
    const [badgeCount, completedQuizzes] = await Promise.all([
      this.badgeModel.countDocuments({ user: user._id }),
      this.quizModel.countDocuments({ user: user._id, completed: true }),
    ]);
    return {
      totalBadges: badgeCount,
      completedQuizzes,
    };
  }

  private async getMentorDashboardData(user: User): Promise<DashboardData> {
    return {
      // success: true,
      // message: 'Mentor dashboard data retrieved successfully',
      // timestamp: new Date().toISOString(),
      // userId: (user as any)._id,
      student: [],
      badges: [],
      showcases: [],
    };
  }

  private async getMentorSummary(user: User): Promise<DashboardSummary> {
    return {
      totalStudent: 0,
      totalBadges: await this.badgeModel.countDocuments({ user: user._id }),
      totalShowcases: await this.projectShowcaseModel.countDocuments({
        user: user._id,
      }),
    };
  }

  private async getParentDashboardData(user: User): Promise<DashboardData> {
    return {
      // success: true,
      // message: 'Parent dashboard data retrieved successfully',
      // timestamp: new Date().toISOString(),
      // userId: (user as any)._id,
      student: [],
      badges: [],
      showcases: [],
    };
  }

  private async getParentSummary(user: User): Promise<DashboardSummary> {
    return {
      totalStudent: 0,
      totalBadges: 0,
      totalShowcases: 0,
    };
  }

  private async getSchoolAdminDashboardData(
    user: User,
  ): Promise<DashboardData> {
    const [students] = await Promise.all([
      this.userModel
        .find({
          role: UserRole.STUDENT,
          createdBy: user._id,
          deletedAt: null,
        })
        .populate('school', 'schoolName schoolContactPerson email logoUrl')
        .populate('createdBy', 'firstName lastName email role')
        .populate('quizzes')
        .lean(),
    ]);

    return {
      student: students,
      showcases: [],
      analytics: {
        totalStudent: students.length,
      },
    };
  }

  private async getSchoolAdminSummary(user: User): Promise<DashboardSummary> {
    return {
      totalStudent: 0,
      totalBadges: 0,
      totalShowcases: 0,
    };
  }

  // ENDPOINTS FOR CATEGORY
  // CREATE CATEGORY
  // async create(createDto: CreateCategoryDto, userId: string) {
  //   try {
  //     // Check if user is a super admin
  //     const user = await this.userModel.findById(userId);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }

  //     if (user.role !== UserRole.SUPER_ADMIN) {
  //       throw new BadRequestException(
  //         'Only super admins can create categories',
  //       );
  //     }

  //     // Check if category with same name already exists
  //     const existingCategory = await this.categoryModel.findOne({
  //       name: createDto.name,
  //     });
  //     if (existingCategory) {
  //       throw new BadRequestException(
  //         `Category with name "${createDto.name}" already exists`,
  //       );
  //     }

  //     const newCategory = new this.categoryModel({
  //       ...createDto,
  //       createdBy: new Types.ObjectId(userId),
  //     });

  //     const savedCategory = await newCategory.save();
  //     this.logger.log(
  //       `Category created: ${savedCategory._id} by user ${userId}`,
  //     );

  //     return savedCategory;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error creating category: ${error.message}`,
  //       error.stack,
  //     );
  //     throw error;
  //   }
  // }
  async create(createDto: CreateCategoryDto) {
    try {
      // Check if category with same name already exists
      const existingCategory = await this.categoryModel.findOne({
        name: createDto.name,
      });
      if (existingCategory) {
        throw new BadRequestException(
          `Category with name "${createDto.name}" already exists`,
        );
      }

      const newCategory = new this.categoryModel({
        ...createDto,
        // Remove the createdBy field or make it optional
      });

      const savedCategory = await newCategory.save();
      this.logger.log(`Category created: ${savedCategory._id}`);

      return savedCategory;
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // GET CATEGORIES
  async findAll() {
    try {
      return this.categoryModel.find().sort({ name: 1 }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding all categories: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // GET CATEGORY BY ID
  async findOne(id: string) {
    try {
      const category = await this.categoryModel.findById(id).exec();
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(
        `Error finding category by ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // EDIT CATEGORY
  async update(id: string, updateDto: UpdateCategoryDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException(
          'Only super admins can update categories',
        );
      }

      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id).exec();
      if (!existingCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Check if name is being updated and is unique
      if (updateDto.name && updateDto.name !== existingCategory.name) {
        const nameExists = await this.categoryModel
          .findOne({
            name: updateDto.name,
            _id: { $ne: id },
          })
          .exec();

        if (nameExists) {
          throw new BadRequestException(
            `Category with name "${updateDto.name}" already exists`,
          );
        }
      }

      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(id, updateDto, { new: true })
        .exec();

      this.logger.log(`Category updated: ${id} by user ${userId}`);

      return updatedCategory;
    } catch (error) {
      this.logger.error(
        `Error updating category ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // DELETE CATEGORY
  async remove(id: string, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException(
          'Only super admins can delete categories',
        );
      }

      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id).exec();
      if (!existingCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // TODO: Check if category is in use by any challenges or communities
      // If needed, this would involve checking references in other collections

      const deletedCategory = await this.categoryModel
        .findByIdAndDelete(id)
        .exec();
      this.logger.log(`Category deleted: ${id} by user ${userId}`);

      return deletedCategory;
    } catch (error) {
      this.logger.error(
        `Error deleting category ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // USERS SERVICES
  async findAllUsers(): Promise<User[]> {
    return this.userModel
      .find({ deletedAt: null })
      .populate('school')
      .populate('createdBy')
      .populate('subscription')
      .lean()
      .exec();
  }

  async findById(userId: string | Types.ObjectId) {
    if (!userId) return null;
    return this.userModel.findById(userId).lean().exec();
  }
}
