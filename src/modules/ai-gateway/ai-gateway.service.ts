import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { QuizDataService } from '../ai/quiz-data.service';

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly quizDataService: QuizDataService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3001';
  }

  // Forward quiz creation request to AI microservice
  async createQuiz(userId: string, ageRange: string, token: string) {
    try {
      this.logger.log(`Creating quiz for user ${userId} with age range ${ageRange}`);
      
      this.logger.debug(`Sending request to AI service: ${this.aiServiceUrl}/api/ai/quiz`);
      this.logger.debug(`Request body: ${JSON.stringify({ userId, ageRange })}`);
      
      let useLocalFallback = false;
      let response;
      
      try {
        response = await firstValueFrom(
          this.httpService.post(
            `${this.aiServiceUrl}/api/ai/quiz`,
            { userId, ageRange },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000 // 10 second timeout
            }
          )
        );
        
        // Check if the response has empty questions and log a warning
        if (response?.data?.quiz?.questions && response.data.quiz.questions.length === 0) {
          this.logger.warn('Received quiz with empty questions from AI service');
          this.logger.debug(`Full response: ${JSON.stringify(response.data)}`);
          useLocalFallback = true;
        }
      } catch (serviceError) {
        this.logger.warn(`AI service unavailable or returned error: ${serviceError.message}`);
        useLocalFallback = true;
      }
      
      // Use local fallback if AI service is unavailable or returned empty questions
      if (useLocalFallback) {
        this.logger.log('Using local quiz data service as fallback');
        const quizData = this.quizDataService.loadQuizData(ageRange);
        
        // Create a response structure similar to what the AI service would return
        return {
          success: true,
          message: 'Quiz created successfully (using fallback)',
          quiz: {
            _id: `local_${new Date().getTime()}_${userId}`,
            userId,
            ageRange,
            questions: quizData.questions,
            createdAt: new Date().toISOString(),
            submitted: false
          }
        };
      }
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create quiz via AI service and fallback', error);
      
      if (error.response) {
        this.logger.error(`Error response status: ${error.response.status}`);
        this.logger.error(`Error response data: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new BadRequestException(`Failed to create quiz: ${error.message}`);
    }
  }

  // Forward quiz submission to AI microservice
  async submitQuiz(quizData: any, token: string) {
    try {
      this.logger.log(`Submitting quiz ${quizData.quizId}`);
      
      // Log the raw quiz data for debugging
      this.logger.debug(`Raw quiz data: ${JSON.stringify(quizData)}`);
      
      // Create a copy of the data to avoid modifying the original
      const processedData = { ...quizData };
      
      // Check if this is a locally generated quiz ID
      const isLocalQuiz = processedData.quizId && processedData.quizId.startsWith('local_');
      
      // Ensure answers are properly structured for the AI microservice
      if (Array.isArray(processedData.answers)) {
        this.logger.debug(`Processing answers array with ${processedData.answers.length} items`);
        
        // Use our quiz data service to process the answers
        try {
          const processedAnswers = this.quizDataService.processAnswers(processedData.answers);
          this.logger.debug(`Processed answers: ${JSON.stringify(processedAnswers)}`);
          processedData.answers = processedAnswers;
        } catch (processingError) {
          this.logger.warn(`Error processing answers with quiz data service: ${processingError.message}`);
          
          // Fallback to manual processing if quiz data service fails
          processedData.answers = processedData.answers.map((answer, index) => {
            if (typeof answer === 'object' && answer !== null) {
              return {
                questionIndex: answer.questionIndex || index,
                answer: answer.answer || 0
              };
            } else if (typeof answer === 'number') {
              return answer;
            } else {
              return 0; // Default value
            }
          });
        }
      }
      
      this.logger.debug(`Processed quiz data: ${JSON.stringify(processedData)}`);
      
      // Ensure quiz ID is valid MongoDB ObjectId format (24 hex chars)
      if (processedData.quizId && processedData.quizId.length < 24) {
        this.logger.warn(`Quiz ID appears truncated: ${processedData.quizId}. Attempting to pad.`);
        // If shorter than 24 characters, it might be truncated
        processedData.quizId = processedData.quizId.padEnd(24, '0');
        this.logger.log(`Padded quiz ID to: ${processedData.quizId}`);
      }
      
      // If this was a locally generated quiz, handle it locally without calling the AI service
      if (isLocalQuiz) {
        this.logger.log('Processing local quiz submission without calling AI service');
        
        // Generate a simple analysis based on the answers
        const averageScore = processedData.answers.reduce((sum, val) => sum + val, 0) / processedData.answers.length;
        const strengths = averageScore > 1.5 ? ['Curious learner', 'Self-motivated'] : ['Practical thinker'];
        
        return {
          success: true,
          message: 'Quiz submitted successfully (local processing)',
          analysis: {
            strengths,
            interests: ['Learning new skills', 'Exploring topics of interest'],
            careerPaths: ['Education', 'Research', 'Technology'],
            learningStyle: 'Mixed',
            recommendations: {
              books: [],
              videos: [],
              activities: []
            }
          }
        };
      }
      
      // Otherwise, call the AI microservice
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/quiz/submit`,
          processedData,
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000 // 60 second timeout for quiz submissions which need AI processing
          }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to submit quiz via AI service', error);
      
      if (error.response) {
        this.logger.error(`Error response status: ${error.response.status}`);
        this.logger.error(`Error response data: ${JSON.stringify(error.response.data)}`);
      }
      
      // Generate a minimal fallback response if everything fails
      return {
        success: true,
        message: 'Quiz submitted with basic analysis (fallback)',
        analysis: {
          strengths: ['Self-learning'],
          interests: ['General learning'],
          careerPaths: ['Various paths available'],
          learningStyle: 'Mixed',
          recommendations: {
            message: 'Please try again later for personalized recommendations'
          }
        }
      };
    }
  }

  // Forward recommendations request to AI microservice
  async getRecommendations(userId: string, token: string) {
    try {
      this.logger.log(`Getting recommendations for user ${userId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/api/ai/recommendations?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get recommendations via AI service', error.message);
      throw new NotFoundException('No recommendations found');
    }
  }

  // Forward POST recommendations request to AI microservice
  async postRecommendations(userId: string, analysisData: any, token: string) {
    try {
      this.logger.log(`Getting POST recommendations for user ${userId}`);
      
      // Process data before sending to the AI microservice
      const processedData = { userId, ...analysisData };
      
      // Ensure quiz ID is valid MongoDB ObjectId format (24 hex chars) if present
      if (processedData.quizId && processedData.quizId.length < 24) {
        this.logger.warn(`Quiz ID appears truncated in recommendations request: ${processedData.quizId}. Attempting to pad.`);
        processedData.quizId = processedData.quizId.padEnd(24, '0');
        this.logger.log(`Padded quiz ID to: ${processedData.quizId}`);
      }
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/recommendations`,
          processedData,
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 60000 // 60 second timeout for recommendations which need AI processing
          }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get POST recommendations via AI service', error);
      
      if (error.response) {
        this.logger.error(`Error response status: ${error.response.status}`);
        this.logger.error(`Error response data: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new BadRequestException('Failed to get recommendations');
    }
  }

  // Forward career recommendations request to AI microservice
  async getCareerRecommendations(userId: string, token: string) {
    try {
      this.logger.log(`Getting career recommendations for user ${userId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/api/ai/career-recommendations?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get career recommendations via AI service', error.message);
      throw new NotFoundException('No career recommendations found');
    }
  }

  // Forward quiz analysis request to AI microservice
  async getQuizAnalysis(userId: string, quizId: string, token: string) {
    try {
      this.logger.log(`Getting quiz analysis for user ${userId}, quiz ${quizId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/api/ai/quiz-analysis?userId=${userId}&quizId=${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get quiz analysis via AI service', error.message);
      throw new NotFoundException('Quiz analysis not found');
    }
  }

  // Forward latest content request to AI microservice
  async getLatestContent(userId: string, token: string) {
    try {
      this.logger.log(`Getting latest content for user ${userId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.aiServiceUrl}/api/ai/content/latest?userId=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get latest content via AI service', error.message);
      throw new NotFoundException('No content found');
    }
  }

  // Guest quiz creation
  async createGuestQuiz(sessionId: string, ageRange: string) {
    try {
      this.logger.log(`Creating guest quiz for session ${sessionId} with age range ${ageRange}`);
      
      let useLocalFallback = false;
      let response;
      
      try {
        response = await firstValueFrom(
          this.httpService.post(
            `${this.aiServiceUrl}/api/ai/guest/quiz`,
            { sessionId, ageRange },
            { timeout: 10000 }
          )
        );
        
        // Check if the response has empty questions
        if (response?.data?.quiz?.questions && response.data.quiz.questions.length === 0) {
          this.logger.warn('Received guest quiz with empty questions from AI service');
          useLocalFallback = true;
        }
      } catch (serviceError) {
        this.logger.warn(`AI service unavailable or returned error: ${serviceError.message}`);
        useLocalFallback = true;
      }
      
      // Use local fallback if AI service is unavailable or returned empty questions
      if (useLocalFallback) {
        this.logger.log('Using local quiz data service as fallback for guest quiz');
        const quizData = this.quizDataService.loadQuizData(ageRange);
        
        return {
          success: true,
          message: 'Guest quiz created successfully (using fallback)',
          quiz: {
            _id: `guest_local_${new Date().getTime()}_${sessionId}`,
            sessionId,
            ageRange,
            questions: quizData.questions,
            createdAt: new Date().toISOString(),
            submitted: false
          }
        };
      }
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create guest quiz via AI service and fallback', error.message);
      throw new BadRequestException(`Failed to create guest quiz: ${error.message}`);
    }
  }

  // Guest quiz submission
  async submitGuestQuiz(quizData: any) {
    try {
      this.logger.log(`Submitting guest quiz ${quizData.quizId}`);
      
      // Process answers using our quiz data service
      if (Array.isArray(quizData.answers)) {
        try {
          const processedAnswers = this.quizDataService.processAnswers(quizData.answers);
          quizData.answers = processedAnswers;
        } catch (processingError) {
          this.logger.warn(`Error processing guest quiz answers: ${processingError.message}`);
        }
      }
      
      // Check if this is a locally generated quiz ID
      const isLocalQuiz = quizData.quizId && quizData.quizId.startsWith('guest_local_');
      
      // If local quiz, handle locally without calling the AI service
      if (isLocalQuiz) {
        this.logger.log('Processing local guest quiz submission without calling AI service');
        
        // Generate a simple analysis based on the answers
        const averageScore = quizData.answers.reduce((sum, val) => sum + val, 0) / quizData.answers.length;
        const strengths = averageScore > 1.5 ? ['Curious learner', 'Self-motivated'] : ['Practical thinker'];
        
        return {
          success: true,
          message: 'Guest quiz submitted successfully (local processing)',
          analysis: {
            strengths,
            interests: ['Learning new skills', 'Exploring topics of interest'],
            careerPaths: ['Education', 'Research', 'Technology'],
            learningStyle: 'Mixed',
            recommendations: {
              books: [],
              videos: [],
              activities: []
            }
          }
        };
      }
      
      // Otherwise call the AI service
      try {
        const response = await firstValueFrom(
          this.httpService.post(
            `${this.aiServiceUrl}/api/ai/guest/quiz/submit`,
            quizData,
            { timeout: 10000 }
          )
        );
        
        return response.data;
      } catch (serviceError) {
        this.logger.warn(`AI service error submitting guest quiz: ${serviceError.message}`);
        
        // Fallback response
        return {
          success: true,
          message: 'Guest quiz submitted with basic analysis (fallback)',
          analysis: {
            strengths: ['Self-learning'],
            interests: ['General learning'],
            careerPaths: ['Various paths available'],
            learningStyle: 'Mixed',
            recommendations: {
              message: 'Please try again later for personalized recommendations'
            }
          }
        };
      }
    } catch (error) {
      this.logger.error('Failed to submit guest quiz via AI service and fallback', error.message);
      
      // Return a minimal success response instead of throwing an error
      return {
        success: true,
        message: 'Guest quiz submitted (minimal fallback)',
        analysis: {
          message: 'Analysis temporarily unavailable. Please try again later.'
        }
      };
    }
  }

  // Guest recommendations
  async getGuestRecommendations(sessionId: string, analysisData: any) {
    try {
      this.logger.log(`Getting guest recommendations for session ${sessionId}`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceUrl}/api/ai/guest/recommendations`,
          { sessionId, ...analysisData }
        )
      );
      
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get guest recommendations via AI service', error.message);
      throw new BadRequestException('Failed to get guest recommendations');
    }
  }

  // Test AI service health
  async testAiService() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/api/ai/test/youtube`)
      );
      
      return {
        status: 'healthy',
        aiService: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('AI service health check failed', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Health check for AI Gateway and microservice connection
  async healthCheck() {
    const timestamp = new Date().toISOString();
    let aiMicroserviceStatus = null;
    let overallStatus = 'healthy';

    try {
      this.logger.debug(`Checking AI microservice health at ${this.aiServiceUrl}/api/ai/health`);
      
      // Check if AI microservice is accessible
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/api/ai/health`, { timeout: 5000 })
      );
      
      aiMicroserviceStatus = response.data;
      
    } catch (error) {
      this.logger.error(`AI microservice health check failed: ${error.message}`);
      
      aiMicroserviceStatus = {
        status: 'unavailable',
        error: error.message
      };
      
      overallStatus = 'degraded';
    }
    
    // Get AI Gateway configuration
    const aiGateway = {
      status: 'healthy',
      version: '1.0.0',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        aiServiceUrl: this.aiServiceUrl
      },
      lastContactAttempt: timestamp
    };
    
    return {
      status: overallStatus,
      timestamp,
      aiGateway,
      aiMicroservice: aiMicroserviceStatus
    };
  }
}