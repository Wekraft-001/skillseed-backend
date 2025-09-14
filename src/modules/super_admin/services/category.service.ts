import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { ChallengeCategory, ChallengeCategoryDocument, User, UserDocument } from 'src/modules/schemas';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(ChallengeCategory.name) private categoryModel: Model<ChallengeCategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CategoryService');
  }

  async create(createDto: CreateCategoryDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Only super admins can create categories');
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

      const savedCategory = await newCategory.save();
      this.logger.log(`Category created: ${savedCategory._id} by user ${userId}`);
      
      return savedCategory;
    } catch (error) {
      this.logger.error(`Error creating category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll() {
    try {
      return this.categoryModel.find().sort({ name: 1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding all categories: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryModel.findById(id).exec();
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(`Error finding category by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateCategoryDto, userId: string) {
    try {
      // Check if user is a super admin
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      if (user.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Only super admins can update categories');
      }

      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id).exec();
      if (!existingCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // Check if name is being updated and is unique
      if (updateDto.name && updateDto.name !== existingCategory.name) {
        const nameExists = await this.categoryModel.findOne({ 
          name: updateDto.name,
          _id: { $ne: id }
        }).exec();
        
        if (nameExists) {
          throw new BadRequestException(`Category with name "${updateDto.name}" already exists`);
        }
      }

      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(id, updateDto, { new: true })
        .exec();
        
      this.logger.log(`Category updated: ${id} by user ${userId}`);
      
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating category ${id}: ${error.message}`, error.stack);
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
        throw new BadRequestException('Only super admins can delete categories');
      }

      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id).exec();
      if (!existingCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      // TODO: Check if category is in use by any challenges or communities
      // If needed, this would involve checking references in other collections
      
      const deletedCategory = await this.categoryModel.findByIdAndDelete(id).exec();
      this.logger.log(`Category deleted: ${id} by user ${userId}`);
      
      return deletedCategory;
    } catch (error) {
      this.logger.error(`Error deleting category ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
