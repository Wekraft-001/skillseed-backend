import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Community, CommunityDocument, User, UserDocument } from 'src/modules/schemas';
import { CommunityCategory } from 'src/modules/schemas/community.schema';
import { UserRole } from 'src/common/interfaces';

@Injectable()
export class SeedCommunitiesService {
  constructor(
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seed(): Promise<void> {
    try {
      // Find a super admin user
      const superAdmin = await this.userModel.findOne({ role: UserRole.SUPER_ADMIN });
      
      if (!superAdmin) {
        console.error('No super admin user found in the database.');
        return;
      }

      // Sample communities
      const communities = [
        {
          name: 'Arts & Crafts',
          description: 'Express your creativity through various arts and crafts projects! Join our community to learn drawing, painting, crafting, and more.',
          category: CommunityCategory.ARTS_CRAFTS,
          imageUrl: 'https://example.com/arts-crafts.jpg',
          createdBy: superAdmin._id,
        },
        {
          name: 'Science Fun',
          description: 'Explore the wonders of science through exciting experiments and discoveries! Perfect for curious minds who love to ask "why" and "how".',
          category: CommunityCategory.SCIENCE,
          imageUrl: 'https://example.com/science-fun.jpg',
          createdBy: superAdmin._id,
        },
        {
          name: 'Tech & Coding',
          description: 'Learn to code and explore technology in a fun and engaging way! From basic programming to exciting tech projects.',
          category: CommunityCategory.TECH_CODING,
          imageUrl: 'https://example.com/tech-coding.jpg',
          createdBy: superAdmin._id,
        },
        {
          name: 'Music & Dance',
          description: 'Express yourself through rhythm and movement! Join our community to explore music appreciation, basic instruments, and fun dance routines.',
          category: CommunityCategory.MUSIC_DANCE,
          imageUrl: 'https://example.com/music-dance.jpg',
          createdBy: superAdmin._id,
        },
        {
          name: 'Reading Club',
          description: 'Dive into the wonderful world of books! Share your favorite stories, discuss characters, and improve your reading skills.',
          category: CommunityCategory.READING,
          imageUrl: 'https://example.com/reading-club.jpg',
          createdBy: superAdmin._id,
        },
        {
          name: 'Games & Fun',
          description: 'Play, learn, and grow together! This community focuses on educational games, puzzles, and activities that make learning enjoyable.',
          category: CommunityCategory.GAMES,
          imageUrl: 'https://example.com/games-fun.jpg',
          createdBy: superAdmin._id,
        },
      ];

      // Check if communities already exist
      const existingCount = await this.communityModel.countDocuments();
      
      if (existingCount > 0) {
        console.log(`Communities already seeded (${existingCount} found). Skipping.`);
        return;
      }

      // Insert communities
      await this.communityModel.insertMany(communities);
      
      console.log(`Successfully seeded ${communities.length} communities.`);
    } catch (error) {
      console.error('Error seeding communities:', error);
    }
  }
}
