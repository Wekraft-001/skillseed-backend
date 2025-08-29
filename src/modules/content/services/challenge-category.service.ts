import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { ChallengeCategory, ChallengeCategoryDocument, User, UserDocument } from 'src/modules/schemas';
import { CreateChallengeCategoryDto, UpdateChallengeCategoryDto } from '../dtos';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class ChallengeCategoryService {
  constructor(
    @InjectModel(ChallengeCategory.name) private categoryModel: Model<ChallengeCategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ChallengeCategoryService');
  }

  async create(createDto: CreateChallengeCategoryDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Only super admins can create challenge categories');
      }

      // Check if category with same name already exists
      const existingCategory = await this.categoryModel.findOne({ name: createDto.name });
      if (existingCategory) {
        throw new BadRequestException(`Category with name "${createDto.name}" already exists`);
      }

      const newCategory = new this.categoryModel({
        ...createDto,
        createdBy: new Types.ObjectId(userId),
      });

      return await newCategory.save();
    } catch (error) {
      this.logger.error(`Error creating challenge category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.categoryModel.find().sort({ name: 1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding challenge categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryModel.findById(id);
      if (!category) {
        throw new NotFoundException(`Challenge category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(`Error finding challenge category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateChallengeCategoryDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Only super admins can update challenge categories');
      }

      // Check if category exists
      const category = await this.categoryModel.findById(id);
      if (!category) {
        throw new NotFoundException(`Challenge category with ID ${id} not found`);
      }

      // If updating name, check if name is already taken
      if (updateDto.name && updateDto.name !== category.name) {
        const existingCategory = await this.categoryModel.findOne({ name: updateDto.name });
        if (existingCategory) {
          throw new BadRequestException(`Category with name "${updateDto.name}" already exists`);
        }
      }

      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        updateDto,
        { new: true }
      );

      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating challenge category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Only super admins can delete challenge categories');
      }

      // Check if category exists
      const category = await this.categoryModel.findById(id);
      if (!category) {
        throw new NotFoundException(`Challenge category with ID ${id} not found`);
      }

      await this.categoryModel.findByIdAndDelete(id);
      return { message: `Challenge category ${category.name} deleted successfully` };
    } catch (error) {
      this.logger.error(`Error deleting challenge category: ${error.message}`, error.stack);
      throw error;
    }
  }
}
