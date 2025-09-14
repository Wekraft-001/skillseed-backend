import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import OpenAI from 'openai';
import { Model, Types } from 'mongoose';
import { LoggerService } from 'src/common/logger/logger.service';
import { RedisService } from 'src/redis/redis.service';
import { CareerQuiz, CareerQuizDocument } from '../schemas/career-quiz.schema';
import {
  EducationalContent,
  EducationalContentDocument,
  User,
  UserDocument,
} from '../schemas';
import { SubmitAnswersDto, UserRole } from 'src/common/interfaces';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly predefinedQuizzes = {
    '6-8': {
      scale: [
        '😞 Not at all',
        '😐 A little',
        '🙂 Sometimes',
        '😀 Often',
        '🤩 A lot',
      ],
      phases: [
        {
          name: 'What Makes You Smile?',
          questions: [
            {
              text: 'How much do you like drawing or coloring?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy playing with puzzles or brain games?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'How much fun is it to build with blocks or LEGOs?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you like playing pretend (like doctor or teacher)?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy helping someone bake or cook?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you like singing or dancing to music?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy telling stories or making up adventures?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'How much do you like caring for animals or pets?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy reading books or listening to stories?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you like making your own crafts or toys?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
          ],
          funBreak:
            'Let them unlock a "Smile Star" badge and do a 30-sec dance break with an animation.',
        },
        {
          name: 'Your Superpowers',
          questions: [
            {
              text: 'Are you good at remembering things?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you help others clean up or organize?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: "Do you like trying things again if they don't work the first time?",
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Can you sit still and listen when someone is talking?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Are you good at saying how you feel?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Can you notice how others feel (sad, happy)?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy fixing or improving things?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you like sharing your things with others?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Can you stay calm when things go wrong?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Do you enjoy learning something new?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
          ],
          funBreak:
            '"Power-Up" moment – they get a virtual cape or badge: "Super Helper" or "Creative Star."',
        },
        {
          name: 'If You Could...',
          questions: [
            {
              text: 'Would you want to fly a rocket to the moon?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you like to design your own theme park?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you enjoy being the teacher for a day?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you want to take care of animals in a zoo?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you love to make a movie about your life?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you build a robot to help people?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you design cool clothes or costumes?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you invent a new toy?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you like to be on stage performing?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
            {
              text: 'Would you create a storybook for other kids?',
              answers: [
                '😞 Not at all',
                '😐 A little',
                '🙂 Sometimes',
                '😀 Often',
                '🤩 A lot',
              ],
            },
          ],
          funBreak:
            'Reveal their "Imagination Avatar" with a fun description like: "Future Inventor" or "Dreamy Designer."',
        },
      ],
    },
    '9-12': {
      scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
      phases: [
        {
          name: 'What Do You Enjoy?',
          questions: [
            {
              text: 'I enjoy reading and learning new facts.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I like building, fixing, or inventing things.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy acting, singing, or performing.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I like helping my classmates or friends.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy using computers or tablets to create.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I like planning or organizing things.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy drawing, painting, or making art.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I like working on challenges or brain games.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy writing stories, poems, or comics.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy exploring how things work.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
          ],
          funBreak:
            'Roll a digital dice to reveal "hidden powers" like "The Curious Leader" or "Imaginative Explorer."',
        },
        {
          name: 'How Do You Work?',
          questions: [
            {
              text: 'I like starting and finishing tasks on my own.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I get excited about solving difficult problems.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy working with others in groups.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I get frustrated when things don't go my way.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I keep my work neat and organized.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I ask lots of questions when learning.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy leading projects or group tasks.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I usually double-check my work.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I enjoy following step-by-step instructions.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I can keep working even when it's hard.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
          ],
          funBreak:
            'Unlock a new "Toolbox Skill" (like Focus, Leadership, Curiosity), with a sound effect or animation.',
        },
        {
          name: 'Dream Job Fun',
          questions: [
            {
              text: 'I would love to be a scientist or researcher.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I want to be a teacher or mentor one day.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I would enjoy creating games or animations.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I'm interested in becoming a doctor or nurse.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I'd love to be a chef or food artist.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I want to write books or scripts.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I'd enjoy being a lawyer or public speaker.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I want to travel the world to help others.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: 'I want to be a leader who changes things.',
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
            {
              text: "I'd like to be on stage or in movies.",
              answers: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
            },
          ],
          funBreak:
            'Career Card Reveal — "You\'d shine as a Creative Director or Young Scientist!"',
        },
      ],
    },
    '13-15': {
      scale: [
        'Strongly Disagree',
        'Disagree',
        'Neutral',
        'Agree',
        'Strongly Agree',
      ],
      phases: [
        {
          name: 'How You See the World',
          questions: [
            {
              text: 'I often question how things work.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I like coming up with new solutions.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I notice small details others don't.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'm curious about how people think.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I like imagining different futures or realities.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I enjoy learning about current events.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I want to understand how systems work (e.g., apps, businesses).',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I get excited by deep discussions.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I enjoy analyzing people's behavior.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I like connecting different ideas together.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
          ],
          funBreak:
            '"Mind Map Reveal" — a glowing web shows their top thinking strengths.',
        },
        {
          name: 'Who You Are With Others',
          questions: [
            {
              text: 'I like being a team leader.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I help keep peace in a group.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I support others when they're upset.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'm comfortable speaking up with ideas.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I like planning events or group tasks.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I often encourage others to keep going.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I enjoy group debates or discussions.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I help organize people or materials.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I try to listen before I speak.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'm good at resolving problems in teams.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
          ],
          funBreak:
            'They earn a "Team Type" — e.g., "The Motivator," "The Organizer," or "The Listener."',
        },
        {
          name: 'You in the Future',
          questions: [
            {
              text: 'I want to be my own boss or entrepreneur.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I dream of working with cutting-edge technology.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'd love to do work that helps the planet.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I see myself as a future inventor or designer.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I want to influence policies or laws.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I imagine myself on a creative team.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'm passionate about solving real-world problems.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'd like to build or manage big projects.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: "I'd love to mentor or coach others.",
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
            {
              text: 'I want to work globally and travel.',
              answers: [
                'Strongly Disagree',
                'Disagree',
                'Neutral',
                'Agree',
                'Strongly Agree',
              ],
            },
          ],
          funBreak:
            'They unlock their "Impact Identity" — "World Builder," "Creative Force," "Future Leader."',
        },
      ],
    },
    '16-18': {
      scale: ['Very Untrue', 'Untrue', 'Neutral', 'True', 'Very True'],
      phases: [
        {
          name: 'Values and Strengths',
          questions: [
            {
              text: "I want to make an impact in people's lives.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I value independence and autonomy in work.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I enjoy being challenged mentally.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I care deeply about fairness and justice.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'm drawn to beauty, art, or expression.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I enjoy leading people or ideas.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I find meaning in solving complex problems.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I believe in building communities.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I thrive when I'm learning something new.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I value freedom to create my own path.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
          ],
          funBreak:
            'Values visualization — a glowing "constellation" that connects their key values.',
        },
        {
          name: 'Skills and Style',
          questions: [
            {
              text: "I'm able to make decisions under pressure.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I can manage multiple tasks effectively.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I prefer structure over open-ended tasks.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I enjoy organizing ideas or systems.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'm confident presenting or pitching.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I stay calm and focused when things are unclear.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I work best when I know the purpose behind a task.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I like collaborating with others to get results.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'm comfortable giving and receiving feedback.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I adapt quickly when plans change.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
          ],
          funBreak:
            'Unlock their "Skill DNA" — with highlights like "Decision-Maker," "Strategist," or "Vision Mapper."',
        },
        {
          name: 'Vision & Career Match',
          questions: [
            {
              text: "I'm interested in launching my own business.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I want to solve health or science problems.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'd love to create visual content or design.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I want to research and innovate in tech.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'd enjoy shaping education or policy.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I want to lead others toward a big goal.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'd thrive in a creative or storytelling role.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: 'I want a career that allows me to travel.',
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I'm passionate about social change.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
            {
              text: "I want to develop new ideas that don't exist yet.",
              answers: [
                'Very Untrue',
                'Untrue',
                'Neutral',
                'True',
                'Very True',
              ],
            },
          ],
          funBreak:
            'Reveal a "Career Launchpad" with 3 potential future journeys they can explore deeper.',
        },
      ],
    },
  };

  constructor(
    private configService: ConfigService,
    private readonly logger: LoggerService,
    // Redis injected via Global module
    private readonly redisService: RedisService,

    @InjectModel(CareerQuiz.name)
    private readonly quizModel: Model<CareerQuizDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(EducationalContent.name)
    private readonly eduContentModel: Model<EducationalContentDocument>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      maxRetries: 2,
    });
  }

  // Signed-in helpers (use existing logic but by userId)
  async generateCareerQuizForUserId(userId: string, userAgeRange: string) {
    this.logger.log(`Generating quiz for user ${userId} with age range ${userAgeRange}`);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    // Get the quiz data from the database
    const quizDoc = await this.generateCareerQuiz(user as any, userAgeRange);
    
    this.logger.log(`Created quiz with ID: ${quizDoc._id.toString()} for user ${userId}`);
    
    // Return the quiz with a simplified format (no phases)
    return {
      quizId: quizDoc._id.toString(),
      quiz: {
        questions: quizDoc.questions
      }
    };
  }

  async getLatestEducationalContentForUser(userId: string) {
    return this.eduContentModel
      .findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // Guest flows via Redis
  private guestKey(sessionId: string, quizId?: string) {
    return quizId
      ? `guest_quiz:${sessionId}:${quizId}`
      : `guest_quiz:${sessionId}`;
  }
  
  // Helper to extract JSON from OpenAI response text
  private extractJson(text: string): string {
    // Extract JSON from the response if it's wrapped in backticks or has extra text
    const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/) || 
                      text.match(/({[\s\S]*})/);
    return jsonMatch ? jsonMatch[1].trim() : text.trim();
  }

  // Generate a guest quiz JSON (no DB writes)
  async generateGuestCareerQuiz(sessionId: string, ageRange: string) {
    const validAgeRanges = ['6-8', '9-12', '13-15', '16-18'];
    if (!validAgeRanges.includes(ageRange)) {
      throw new BadRequestException(
        `Invalid ageRange: ${ageRange}. Must be one of: ${validAgeRanges.join(', ')}`,
      );
    }

    // Predefined scales for different age ranges
    const ageScales = {
      '6-8': [
        '😞 Not at all',
        '😐 A little',
        '🙂 Sometimes',
        '😀 Often',
        '🤩 A lot',
      ],
      '9-12': ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
      '13-15': [
        'Strongly Disagree',
        'Disagree',
        'Neutral',
        'Agree',
        'Strongly Agree',
      ],
      '16-18': ['Very Untrue', 'Untrue', 'Neutral', 'True', 'Very True'],
    };

    // Predefined questions for each age range
    const predefinedQuestions = {
      '6-8': [
        'How much do you like drawing or coloring?',
        'Do you enjoy playing with puzzles or brain games?',
        'How much fun is it to build with blocks or LEGOs?',
        'Do you like playing pretend (like doctor or teacher)?',
        'Do you enjoy helping someone bake or cook?',
        'Do you like singing or dancing to music?',
        'Do you enjoy telling stories or making up adventures?',
        'How much do you like caring for animals or pets?',
        'Do you enjoy reading books or listening to stories?',
        'Do you like making your own crafts or toys?',
        'Are you good at remembering things?',
        'Do you help others clean up or organize?',
        'Do you like trying things again if they don\'t work the first time?',
        'Can you sit still and listen when someone is talking?',
        'Are you good at saying how you feel?',
        'Can you notice how others feel (sad, happy)?',
        'Do you enjoy fixing or improving things?',
        'Do you like sharing your things with others?',
        'Can you stay calm when things go wrong?',
        'Do you enjoy learning something new?',
        'Would you want to fly a rocket to the moon?',
        'Would you like to design your own theme park?',
        'Would you enjoy being the teacher for a day?',
        'Would you want to take care of animals in a zoo?',
        'Would you love to make a movie about your life?',
        'Would you build a robot to help people?',
        'Would you design cool clothes or costumes?',
        'Would you invent a new toy?',
        'Would you like to be on stage performing?',
        'Would you create a storybook for other kids?'
      ],
      '9-12': [
        'I enjoy reading and learning new facts.',
        'I like building, fixing, or inventing things.',
        'I enjoy acting, singing, or performing.',
        'I like helping my classmates or friends.',
        'I enjoy using computers or tablets to create.',
        'I like planning or organizing things.',
        'I enjoy drawing, painting, or making art.',
        'I like working on challenges or brain games.',
        'I enjoy writing stories, poems, or comics.',
        'I enjoy exploring how things work.',
        'I like starting and finishing tasks on my own.',
        'I get excited about solving difficult problems.',
        'I enjoy working with others in groups.',
        'I get frustrated when things don\'t go my way.',
        'I keep my work neat and organized.',
        'I ask lots of questions when learning.',
        'I enjoy leading projects or group tasks.',
        'I usually double-check my work.',
        'I enjoy following step-by-step instructions.',
        'I can keep working even when it\'s hard.',
        'I would love to be a scientist or researcher.',
        'I want to be a teacher or mentor one day.',
        'I would enjoy creating games or animations.',
        'I\'m interested in becoming a doctor or nurse.',
        'I\'d love to be a chef or food artist.',
        'I want to write books or scripts.',
        'I\'d enjoy being a lawyer or public speaker.',
        'I want to travel the world to help others.',
        'I want to be a leader who changes things.',
        'I\'d like to be on stage or in movies.'
      ],
      '13-15': [
        'I often question how things work.',
        'I like coming up with new solutions.',
        'I notice small details others don\'t.',
        'I\'m curious about how people think.',
        'I like imagining different futures or realities.',
        'I enjoy learning about current events.',
        'I want to understand how systems work (e.g., apps, businesses).',
        'I get excited by deep discussions.',
        'I enjoy analyzing people\'s behavior.',
        'I like connecting different ideas together.',
        'I like being a team leader.',
        'I help keep peace in a group.',
        'I support others when they\'re upset.',
        'I\'m comfortable speaking up with ideas.',
        'I like planning events or group tasks.',
        'I often encourage others to keep going.',
        'I enjoy group debates or discussions.',
        'I help organize people or materials.',
        'I try to listen before I speak.',
        'I\'m good at resolving problems in teams.',
        'I want to be my own boss or entrepreneur.',
        'I dream of working with cutting-edge technology.',
        'I\'d love to do work that helps the planet.',
        'I see myself as a future inventor or designer.',
        'I want to influence policies or laws.',
        'I imagine myself on a creative team.',
        'I\'m passionate about solving real-world problems.',
        'I\'d like to build or manage big projects.',
        'I\'d love to mentor or coach others.',
        'I want to work globally and travel.'
      ],
      '16-18': [
        'I want to make an impact in people\'s lives.',
        'I value independence and autonomy in work.',
        'I enjoy being challenged mentally.',
        'I care deeply about fairness and justice.',
        'I\'m drawn to beauty, art, or expression.',
        'I enjoy leading people or ideas.',
        'I find meaning in solving complex problems.',
        'I believe in building communities.',
        'I thrive when I\'m learning something new.',
        'I value freedom to create my own path.',
        'I\'m able to make decisions under pressure.',
        'I can manage multiple tasks effectively.',
        'I prefer structure over open-ended tasks.',
        'I enjoy organizing ideas or systems.',
        'I\'m confident presenting or pitching.',
        'I stay calm and focused when things are unclear.',
        'I work best when I know the purpose behind a task.',
        'I like collaborating with others to get results.',
        'I\'m comfortable giving and receiving feedback.',
        'I adapt quickly when plans change.',
        'I\'m interested in launching my own business.',
        'I want to solve health or science problems.',
        'I\'d love to create visual content or design.',
        'I want to research and innovate in tech.',
        'I\'d enjoy shaping education or policy.',
        'I want to lead others toward a big goal.',
        'I\'d thrive in a creative or storytelling role.',
        'I want a career that allows me to travel.',
        'I\'m passionate about social change.',
        'I want to develop new ideas that don\'t exist yet.'
      ]
    };

    // Get the appropriate scale and questions for the user's age range
    const scale = ageScales[ageRange];
    const questions = predefinedQuestions[ageRange];

    if (!scale || !questions) {
      throw new BadRequestException('Failed to get questions for the specified age range');
    }

    // Format questions with their answer scales
    const formattedQuestions = questions.map(text => ({
      text,
      answers: scale
    }));

    // Return the quiz with questions only (no phases)
    return {
      questions: formattedQuestions
    };
  }

  async generateGuestQuiz(sessionId: string, ageRange: string) {
    const quiz = await this.generateGuestCareerQuiz(sessionId, ageRange);
    const quizId =
      (quiz as any)._id?.toString?.() || Math.random().toString(36).slice(2);
    await this.redisService.set(
      this.guestKey(sessionId, quizId),
      JSON.stringify({ ageRange, quiz, answers: [], analysis: null }),
      86400,
    );
    return { quizId, quiz };
  }

  async submitGuestAnswers(body: {
    sessionId: string;
    quizId: string;
    answers: { phaseIndex: number; questionIndex: number; answer: string }[];
  }) {
    const key = this.guestKey(body.sessionId, body.quizId);
    const raw = await this.redisService.get(key);
    if (!raw) throw new NotFoundException('Guest quiz not found');
    const state = JSON.parse(raw);
    const result = await this.analyzeGuestAnswers({
      sessionId: body.sessionId,
      quizId: body.quizId,
      answers: body.answers,
    });
    state.answers = body.answers;
    state.analysis = result.analysis;
    await this.redisService.set(key, JSON.stringify(state), 86400);
    return result;
  }

  // Analyze guest answers and return analysis; state is kept in Redis by caller
  async analyzeGuestAnswers(params: {
    sessionId: string;
    quizId: string;
    answers: { phaseIndex: number; questionIndex: number; answer: string }[];
  }) {
    const key = this.guestKey(params.sessionId, params.quizId);
    const raw = await this.redisService.get(key);
    if (!raw) throw new NotFoundException('Guest quiz not found');
    const state = JSON.parse(raw);

    const answersText: string[] = [];
    for (const a of params.answers) {
      const phase = state.quiz?.phases?.[a.phaseIndex];
      const question = phase?.questions?.[a.questionIndex];
      if (!question) continue;
      answersText.push(`Question: ${question.text}\nAnswer: ${a.answer}`);
    }

    const prompt = `Given the following answers from a child, provide a short, friendly profile and recommendations.\n\n${answersText.join('\n\n')}`;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = response.choices[0].message.content || '';
    return {
      analysis,
      quizId: params.quizId,
      answers: params.answers,
    };
  }

  // Guest recommendations removed
  async generateGuestRecommendations(params: {
    sessionId: string;
    quizId: string;
  }) {
    throw new BadRequestException(
      'Guest recommendations are not available. Please register to get personalized recommendations.',
    );
  }

  async generateCareerQuiz(
    user: User,
    userAgeRange: string,
  ): Promise<CareerQuiz> {
    const validAgeRanges = ['6-8', '9-12', '13-15', '16-18'];
    if (!validAgeRanges.includes(userAgeRange)) {
      throw new BadRequestException(
        `Invalid userAgeRange: ${userAgeRange}. Must be one of: ${validAgeRanges.join(', ')}`,
      );
    }

    const ageScales = {
      '6-8': {
        scale: [
          '😞 Not at all',
          '😐 A little',
          '🙂 Sometimes',
          '😀 Often',
          '🤩 A lot',
        ],
        phases: [
          'What Makes You Smile?',
          'Your Superpowers',
          'If You Could...',
        ],
        funBreaks: [
          'Unlock a “Smile Star” badge and do a 30-sec dance break with an animation.',
          '“Power-Up” moment – they get a virtual cape or badge: “Super Helper” or “Creative Star.”',
          'Reveal their “Imagination Avatar” with a fun description like: “Future Inventor” or “Dreamy Designer.”',
        ],
      },
      '9-12': {
        scale: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        phases: ['What Do You Enjoy?', 'How Do You Work?', 'Dream Job Fun'],
        funBreaks: [
          'Roll a digital dice to reveal “hidden powers” like “The Curious Leader” or “Imaginative Explorer.”',
          'Unlock a new “Toolbox Skill” (like Focus, Leadership, Curiosity), with a sound effect or animation.',
          'Career Card Reveal — “You’d shine as a Creative Director or Young Scientist!”',
        ],
      },
      '13-15': {
        scale: [
          'Strongly Disagree',
          'Disagree',
          'Neutral',
          'Agree',
          'Strongly Agree',
        ],
        phases: [
          'How You See the World',
          'Who You Are With Others',
          'You in the Future',
        ],
        funBreaks: [
          '“Mind Map Reveal” — a glowing web shows their top thinking strengths.',
          'They earn a “Team Type” — e.g., “The Motivator,” “The Organizer,” or “The Listener.”',
          'They unlock their “Impact Identity” — “World Builder,” “Creative Force,” “Future Leader.”',
        ],
      },
      '16-18': {
        scale: ['Very Untrue', 'Untrue', 'Neutral', 'True', 'Very True'],
        phases: [
          'Values and Strengths',
          'Skills and Style',
          'Vision & Career Match',
        ],
        funBreaks: [
          'Values visualization — a glowing “constellation” that connects their key values.',
          'Unlock their “Skill DNA” — with highlights like “Decision-Maker,” “Strategist,” or “Vision Mapper.”',
          'Reveal a “Career Launchpad” with 3 potential future journeys they can explore deeper.',
        ],
      },
    };

    let ageRange: string;
    // Use the provided userAgeRange parameter instead of calculating from user.age
    ageRange = userAgeRange;
    
    // Log which age range we're using
    this.logger.log(`Using age range: ${ageRange} for user ${user._id} (actual age: ${user.age})`);
    
    if (!ageScales[ageRange]) {
      throw new BadRequestException(`Invalid age range: ${ageRange}. Must be one of: ${Object.keys(ageScales).join(', ')}`);
    }

    const { scale, funBreak } = ageScales[ageRange];

    const prompt = `
    Create a fun and interactive career discovery quiz for a child aged ${user.age} (age range ${ageRange}).
    
    Answer scale: ${scale.join(', ')}
    
    Generate a quiz with 3 phases, each with 5-10 questions that are appropriate for the age group. 
    Each question must have ${scale.length} multiple-choice answer options matching the scale exactly in this order: ${scale.join(', ')}.
    
    Each phase should have a "name" property and a "funBreak" property describing a fun interactive element.
    
    Your response must be a valid JSON object with EXACTLY this structure:
    {
      "phases": [
        {
          "name": "Phase name",
          "questions": [
            {
              "text": "Question text",
              "answers": ["${scale[0]}", "${scale[1]}", "${scale[2]}", "${scale[3]}", "${scale[4]}"]
            }
          ],
          "funBreak": "Fun break description for this phase"
        }
      ]
    }

    Do not include any text before or after the JSON. Return only the JSON object.
    Ensure the questions are engaging, age-appropriate, and encourage self-reflection.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const contentText = response.choices[0].message.content || '{}';
      this.logger.debug(`Raw quiz response: ${contentText}`);
      
      // Extract and parse JSON from the response
      const parsedContent = this.extractJson(contentText);
      const quizContent = JSON.parse(parsedContent);
      
      // Validate quiz structure
      if (!quizContent.phases || !Array.isArray(quizContent.phases)) {
        this.logger.error(`Invalid quiz content format: ${JSON.stringify(quizContent)}`);
        throw new BadRequestException('Invalid quiz content format: phases array is missing or not an array');
      }

      // Validate each phase
      for (let i = 0; i < quizContent.phases.length; i++) {
        const phase = quizContent.phases[i];
        if (!phase.name || !phase.questions || !Array.isArray(phase.questions) || !phase.funBreak) {
          this.logger.error(`Invalid phase format at index ${i}: ${JSON.stringify(phase)}`);
          throw new BadRequestException(`Invalid phase format at index ${i}: missing name, funBreak, or questions array`);
        }
        
        // Validate questions and answers
        for (let j = 0; j < phase.questions.length; j++) {
          const question = phase.questions[j];
          if (!question.text || !question.answers || !Array.isArray(question.answers) || question.answers.length !== scale.length) {
            this.logger.error(`Invalid question format at phase ${i}, question ${j}: ${JSON.stringify(question)}`);
            throw new BadRequestException(`Invalid question format at phase ${i}, question ${j}: missing text or incorrect number of answers`);
          }
        }
      }

      // Flatten questions and collect fun breaks for database structure
      const flattenedQuestions = [];
      const funBreaks = [];
      
      quizContent.phases.forEach(phase => {
        funBreaks.push(phase.funBreak);
        phase.questions.forEach(question => {
          flattenedQuestions.push({
            text: question.text,
            answers: question.answers,
          });
        });
      });

      const quiz = await this.quizModel.create({
        user: user._id,
        ageRange,
        questions: flattenedQuestions,
        funBreaks: funBreaks,
        completed: false,
        userAnswers: [],
        analysis: '',
        // Store original phases structure for the frontend
        phasesData: quizContent.phases
      });

      return quiz;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error parsing quiz content: ${error.message}`, error.stack);
      throw new BadRequestException(`Error parsing quiz content: ${error.message}`);
    }
  }

  async getAllQuizzes(currentUser: User): Promise<CareerQuiz[]> {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    return await this.quizModel.find().populate('user').exec();
  }

  async analyzeAnswers(dto: SubmitAnswersDto): Promise<any> {
    this.logger.log(`Analyzing answers for quiz ${dto.quizId}`);
    
    const quiz = await this.quizModel
      .findById(dto.quizId)
      .populate('user')
      .exec();
    
    if (!quiz) {
      this.logger.error(`Quiz not found in analyzeAnswers with ID: ${dto.quizId}`);
      throw new NotFoundException('Quiz not found');
    }

    this.logger.log(`Found quiz in analyzeAnswers: ${quiz._id.toString()}, user: ${quiz.user._id.toString()}`);

    if (!dto.answers || !Array.isArray(dto.answers)) {
      this.logger.error('Answers array is missing or invalid');
      throw new BadRequestException('Answers array is missing or invalid');
    }

    const answersText: string[] = [];

    for (const answer of dto.answers) {
      const question = quiz.questions[answer.questionIndex];
      if (!question) {
        throw new BadRequestException(
          `Invalid questionIndex: ${answer.questionIndex} `,
        );
      }

      answersText.push(`Question: ${question.text}\nAnswer: ${answer.answer}`);
    }

    // const answers = dto.answers
    //   .sort((a, b) =>
    //     a.phaseIndex !== b.phaseIndex
    //       ? a.phaseIndex - b.phaseIndex
    //       : a.questionIndex - b.questionIndex,
    //   )
    //   .map((a) => {
    //     const questionText =
    //       quiz.phases[a.phaseIndex].questions[a.questionIndex].text;
    //     return `Question: ${questionText}\nAnswer: ${a.answer}`;
    //   })
    //   .join('\n\n');

    const prompt = `Given the following answers from a child... 
      You are a career counselor analyzing a student's responses to career assessment questions. 
      Based on the following questions and answers, provide a short human toned up to 4 sentence career analysis and recommendations.

      ${answersText.join('\n\n')}

      Please provide:
      1. Analysis of the student's interests and strengths
      2. Potential career paths that align with their responses
      3. Skills they should develop
      4. Educational recommendations
      5. Next steps for career exploration

      Format your response in a clear, encouraging manner suitable for a curious student.
  `.trim();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = response.choices[0].message.content || '';
    this.logger.log(`Generated analysis for quiz ${dto.quizId}: ${analysis.substring(0, 100)}...`);

    quiz.userAnswers = dto.answers;
    quiz.completed = true;
    quiz.analysis = analysis;
    
    try {
      await quiz.save();
      this.logger.log(`Successfully saved quiz ${dto.quizId} with completed status and analysis`);
    } catch (error) {
      this.logger.error(`Error saving quiz ${dto.quizId}: ${error.message}`);
      throw new Error(`Failed to save quiz: ${error.message}`);
    }

    return {
      analysis,
      quizId: quiz._id.toString(),
      userId: quiz.user._id.toString(),
      answers: quiz.userAnswers,
    };
  }

  async submitAnswers(dto: SubmitAnswersDto, userId: string) {
    this.logger.log(`Attempting to submit answers for quiz ${dto.quizId} from user ${userId}`);
    
    const quiz = await this.quizModel
      .findById(dto.quizId)
      .populate('user')
      .exec();
    
    if (!quiz) {
      this.logger.error(`Quiz not found with ID: ${dto.quizId}`);
      throw new NotFoundException('Quiz not found');
    }

    this.logger.log(`Found quiz: ${quiz._id.toString()}, completed: ${quiz.completed}, user: ${quiz.user._id.toString()}`);

    if (quiz.user._id.toString() !== userId.toString()) {
      this.logger.error(`User ${userId} not authorized to submit answers for quiz ${dto.quizId} owned by ${quiz.user._id.toString()}`);
      throw new BadRequestException(
        'You are not authorized to submit answers for this quiz',
      );
    }

    if (quiz.completed) {
      this.logger.warn(`Quiz ${dto.quizId} is already completed`);
      throw new BadRequestException('Quiz already completed');
    }

    this.logger.log(
      `Received answers for quiz ${dto.quizId}: ${JSON.stringify(dto.answers)}`,
    );

    const result = await this.analyzeAnswers(dto);
    this.logger.log(`Successfully analyzed answers for quiz ${dto.quizId}, completed: ${result.quizId}`);
    return result;
  }

  async generateProfileOutcome(dto: SubmitAnswersDto, userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    const quiz = await this.quizModel
      .findOne({ _id: dto.quizId, user: userId })
      .exec();

    if (!quiz || !quiz.completed || !quiz.analysis || !quiz.userAnswers) {
      throw new BadRequestException(
        'Quiz is not completed or missing answers/analysis',
      );
    }

    const prompt = `Based on the following quiz data for a child aged ${user.age}...`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const profileOutcome = response.choices[0].message.content || '';

    return {
      profileOutcome,
      quizId: quiz._id.toString(),
      userId: user._id.toString(),
      answers: quiz.userAnswers,
      previousAnalysis: quiz.analysis,
    };
  }

  async generateEducationalContent(
    userId: string,
    quizId?: string
  ): Promise<EducationalContent> {
    this.logger.log(`Generating educational content for user ${userId}${quizId ? ` with quizId ${quizId}` : ''}`);
    
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      this.logger.error(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }
    
    this.logger.log(`Found user: ${user._id}, age: ${user.age}, role: ${user.role}`);
    
    if (user.role !== UserRole.STUDENT) {
      this.logger.error(`User ${userId} role is ${user.role}, not STUDENT`);
      throw new BadRequestException('Only students can generate content');
    }

    let latestQuiz = null;
    
    try {
      // First try to get quiz directly from database if we have a quiz ID
      if (quizId) {
        this.logger.log(`Attempting direct lookup of quiz ${quizId} by ID`);
        try {
          latestQuiz = await this.quizModel.findById(quizId).exec();
          if (latestQuiz) {
            this.logger.log(`Direct lookup successful for quiz ${quizId}, completed: ${latestQuiz.completed}, has analysis: ${!!latestQuiz.analysis}`);
            
            // If quiz doesn't belong to user, log a warning but still use it
            if (latestQuiz.user.toString() !== userId.toString()) {
              this.logger.warn(`Quiz ${quizId} belongs to user ${latestQuiz.user}, not ${userId}, but proceeding anyway`);
            }
          } else {
            this.logger.warn(`Direct lookup failed, quiz ${quizId} not found`);
          }
        } catch (error) {
          this.logger.error(`Error in direct quiz lookup: ${error.message}`);
        }
      }
      
      // If direct lookup failed or no quizId provided, try getLatestQuiz
      if (!latestQuiz) {
        this.logger.log(`Falling back to getLatestQuiz method for user ${userId}${quizId ? ` with quizId ${quizId}` : ''}`);
        latestQuiz = await this.getLatestQuiz(userId, quizId);
      }
      
      if (!latestQuiz) {
        this.logger.error(`No quiz found for user ${userId}${quizId ? ` with quizId ${quizId}` : ''}`);
        throw new BadRequestException('No quiz found');
      }
      
      if (!latestQuiz.completed || !latestQuiz.analysis) {
        this.logger.error(`Quiz ${latestQuiz._id} found but not completed or missing analysis. Completed: ${latestQuiz.completed}, Has analysis: ${!!latestQuiz.analysis}`);
        throw new BadRequestException('Quiz is not complete or missing analysis');
      }
    } catch (error) {
      this.logger.error(`Error finding quiz: ${error.message}`);
      throw new BadRequestException(`Unable to find quiz: ${error.message}`);
    }
    
    this.logger.log(`Using quiz ${latestQuiz._id} to generate educational content`);

    const prompt = `Generate personalized educational content for a ${user.age}-year-old child named ${user.firstName}.
    
Based on the quiz analysis: ${latestQuiz.analysis}, create a custom learning plan with:

1. Videos: Suggest 3-5 educational YouTube videos. Include title and URL.
2. Books: Suggest 3-5 FREE and OPEN SOURCE books that are completely free to access. Do not include any paid books or books that require purchase. Only suggest books from sources like Project Gutenberg, Open Library, or other free repositories. Include title, author, level, and educational theme.

Format your response as a JSON object with two keys:
- "video": array of {title, url} objects
- "books": array of {title, author, level, theme} objects - ONLY FREE AND OPEN SOURCE BOOKS

For example:
{
  "video": [
    {"title": "Introduction to Fractions", "url": "https://www.youtube.com/watch?v=example1"},
    {"title": "The Water Cycle", "url": "https://www.youtube.com/watch?v=example2"}
  ],
  "books": [
    {"title": "Alice's Adventures in Wonderland", "author": "Lewis Carroll", "level": "Intermediate", "theme": "Imagination"},
    {"title": "The Wonderful Wizard of Oz", "author": "L. Frank Baum", "level": "Intermediate", "theme": "Adventure"}
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const JsonEducationContent = JSON.parse(
      response.choices[0].message.content || '{}',
    );

    const educationalContent = await this.eduContentModel.create({
      user: user._id,
      videoUrl: JsonEducationContent.video || [],
      books: JsonEducationContent.books || [],
      games: [] // Empty games array since we're removing games
    });

    return educationalContent;
  }

  private async getLatestQuiz(userId: string, quizId?: string): Promise<CareerQuiz | null> {
    this.logger.log(`Getting quiz for user ${userId}${quizId ? ` with quizId ${quizId}` : ''}`);
    
    // If quizId is provided, try to find that specific quiz first
    if (quizId) {
      try {
        // First, try to find by exact ID match without user filtering
        const specificQuiz = await this.quizModel
          .findById(quizId)
          .exec();
        
        if (specificQuiz) {
          this.logger.log(`Found quiz with ID ${quizId}, owned by user ${specificQuiz.user}, requesting user: ${userId}`);
          
          // Check if it belongs to the user
          if (specificQuiz.user.toString() === userId.toString()) {
            this.logger.log(`Quiz ${quizId} belongs to user ${userId}, completed: ${specificQuiz.completed}, has analysis: ${!!specificQuiz.analysis}`);
            return specificQuiz;
          } else {
            this.logger.warn(`Quiz ${quizId} found but belongs to user ${specificQuiz.user}, not ${userId}`);
          }
        } else {
          this.logger.warn(`No quiz found with ID ${quizId}`);
        }
      } catch (error) {
        this.logger.error(`Error finding quiz by ID ${quizId}: ${error.message}`);
      }
    }
    
    // Fall back to the latest quiz with analysis
    try {
      const latestQuiz = await this.quizModel
        .findOne({ user: userId, completed: true })
        .sort({ updatedAt: -1 })
        .exec();
      
      if (latestQuiz) {
        this.logger.log(`Found latest quiz: ${latestQuiz._id}, completed: ${latestQuiz.completed}, has analysis: ${!!latestQuiz.analysis}`);
        return latestQuiz;
      } else {
        this.logger.warn(`No completed quizzes found for user ${userId}`);
        
        // As a last resort, look for any quiz for this user
        const anyQuiz = await this.quizModel
          .findOne({ user: userId })
          .sort({ updatedAt: -1 })
          .exec();
          
        if (anyQuiz) {
          this.logger.log(`Found non-completed quiz: ${anyQuiz._id}, completed: ${anyQuiz.completed}, has analysis: ${!!anyQuiz.analysis}`);
          return anyQuiz;
        }
        
        this.logger.warn(`No quizzes at all found for user ${userId}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error finding latest quiz: ${error.message}`);
      return null;
    }
  }
}
