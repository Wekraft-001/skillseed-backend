import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizDataService {
  private readonly logger = new Logger(QuizDataService.name);

  /**
   * Loads quiz data for a specific age range and formats it correctly
   * @param ageRange The age range to load questions for (e.g., '6-8', '9-12', etc.)
   * @returns Formatted quiz data with questions and answer options
   */
  loadQuizData(ageRange: string): any {
    try {
      // Validate age range
      const validAgeRanges = ['6-8', '9-12', '13-15', '16-18'];
      if (!validAgeRanges.includes(ageRange)) {
        throw new BadRequestException(`Invalid age range: ${ageRange}. Valid options are: ${validAgeRanges.join(', ')}`);
      }
      
      const filePath = path.join(__dirname, 'quiz-data', `questions-${ageRange}.json`);
      this.logger.log(`Attempting to load quiz data from: ${filePath}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        this.logger.error(`Quiz data file does not exist at: ${filePath}`);
        
        // List contents of the directory to debug
        const dirPath = path.join(__dirname, 'quiz-data');
        if (fs.existsSync(dirPath)) {
          this.logger.log(`Contents of ${dirPath}:`);
          const files = fs.readdirSync(dirPath);
          files.forEach(file => this.logger.log(`- ${file}`));
        } else {
          this.logger.error(`Directory does not exist: ${dirPath}`);
        }
        
        throw new BadRequestException(`Quiz data file not found for age range: ${ageRange}`);
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      this.logger.log(`Successfully loaded quiz data for age range ${ageRange}`);
      
      // The file contains just an array of question texts, convert to full question objects
      const questionTexts = JSON.parse(data);
      const questions = questionTexts.map(text => ({
        text: text,
        answers: [
          "🤩 A lot",
          "😀 Often",
          "🙂 Sometimes",
          "😐 Not much"
        ]
      }));
      
      return { questions };
    } catch (error) {
      this.logger.error(`Failed to load quiz data for age range ${ageRange}`, error.message);
      throw new BadRequestException(`Failed to load quiz data for age range: ${ageRange} - ${error.message}`);
    }
  }
  
  /**
   * Process answers from the quiz submission
   * @param answers The raw answers from the frontend (can be in different formats)
   * @returns Normalized numeric answers (0-3 scale)
   */
  processAnswers(answers: any[]): number[] {
    try {
      if (!Array.isArray(answers)) {
        this.logger.warn(`Answers is not an array: ${typeof answers}`);
        return [];
      }
      
      return answers.map(answer => {
        // Handle object format with text or emoji answers
        if (typeof answer === 'object' && answer !== null) {
          const answerValue = answer.answer || '';
          
          // Convert emoji or text-based answers to numeric values
          if (typeof answerValue === 'string') {
            if (answerValue.includes('🤩') || answerValue.includes('A lot')) return 3;
            if (answerValue.includes('😀') || answerValue.includes('Often')) return 2;
            if (answerValue.includes('🙂') || answerValue.includes('Sometimes')) return 1;
            if (answerValue.includes('😐') || answerValue.includes('Not much')) return 0;
            return parseInt(answerValue) || 0; // Try parsing as number if no emoji match
          } 
          return typeof answerValue === 'number' ? answerValue : 0;
        } 
        // Handle direct numeric answers
        else if (typeof answer === 'number') {
          return answer;
        }
        // Handle string answers
        else if (typeof answer === 'string') {
          if (answer.includes('🤩') || answer.includes('A lot')) return 3;
          if (answer.includes('😀') || answer.includes('Often')) return 2;
          if (answer.includes('🙂') || answer.includes('Sometimes')) return 1;
          if (answer.includes('😐') || answer.includes('Not much')) return 0;
          return parseInt(answer) || 0;
        }
        
        return 0; // Default if we can't parse
      });
    } catch (error) {
      this.logger.error(`Error processing answers: ${error.message}`, error.stack);
      throw new BadRequestException(`Error processing quiz answers: ${error.message}`);
    }
  }
}