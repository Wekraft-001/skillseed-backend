# SkillSeed AI Gateway and Quiz Generation

## Overview

This implementation provides a robust solution for quiz generation and answer processing in the SkillSeed platform. It includes:

1. A local quiz data service that serves as a fallback when the AI microservice is unavailable
2. Pre-configured quiz questions for different age ranges
3. Improved answer processing to handle both numeric and emoji-based responses
4. Graceful error handling and fallback mechanisms

## How It Works

### Quiz Data Service

The `QuizDataService` in `src/modules/ai/quiz-data.service.ts` provides two main functions:

1. `loadQuizData(ageRange)`: Loads age-appropriate quiz questions from JSON files
2. `processAnswers(answers)`: Normalizes quiz answers to a 0-3 scale, handling different formats

### Quiz Data Files

Quiz questions are stored in JSON files in the `src/modules/ai/quiz-data/` directory:

- `questions-6-8.json`: For children ages 6-8
- `questions-9-12.json`: For children ages 9-12
- `questions-13-15.json`: For adolescents ages 13-15
- `questions-16-18.json`: For teenagers ages 16-18

### AI Gateway Integration

The AI Gateway service (`AiGatewayService`) has been updated to:

1. Try the AI microservice first for quiz creation and submission
2. Fall back to the local quiz data service if the AI microservice fails
3. Process quiz answers correctly regardless of the format received from the frontend
4. Generate basic quiz analysis when the AI microservice is unavailable

## Answer Processing

The system handles multiple answer formats:

1. Numeric values (0-3)
2. Emoji responses:
   - "🤩 A lot" = 3
   - "😀 Often" = 2
   - "🙂 Sometimes" = 1
   - "😐 Not much" = 0
3. Object format: `{ questionIndex: 0, answer: "🤩 A lot" }`

## Deployment Notes

1. The `nest-cli.json` file includes the quiz data files in the build
2. Ensure the `AI_SERVICE_URL` environment variable is correctly set
3. The fallback mechanism ensures users can still take quizzes even if the AI service is down

## Troubleshooting

If you encounter issues:

1. Check the logs for errors related to quiz data loading
2. Verify that the quiz data files are properly included in the build
3. Check the connection to the AI microservice using the `/api/ai/health` endpoint
4. Monitor the behavior of the quiz submission endpoint to ensure answers are processed correctly

## Future Improvements

