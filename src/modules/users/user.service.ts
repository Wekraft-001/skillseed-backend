import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

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
    return this.userModel
      .findById(userId)
      .lean() // plain JS object instead of mongoose doc
      .exec();
  }
}
