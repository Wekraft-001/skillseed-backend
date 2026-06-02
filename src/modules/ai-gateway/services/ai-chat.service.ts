import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LoggerService } from 'src/common/logger/logger.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiChatService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AiChatService');
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(
    messages: ChatMessage[],
    ageRange?: string,
  ): Promise<{ reply: string }> {
    const systemPrompt = this.buildSystemPrompt(ageRange);
    const normalized = this.normalizeMessages(messages);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages: normalized,
    });

    const reply =
      response.content[0]?.type === 'text'
        ? response.content[0].text
        : 'Sorry, I had trouble responding. Please try again! 🙏';

    this.logger.log(`AI chat responded (${reply.length} chars)`);
    return { reply };
  }

  private buildSystemPrompt(ageRange?: string): string {
    const audienceMap: Record<string, string> = {
      '6-8':
        'young children aged 6–8. Use very simple words, lots of emojis, and be super encouraging and playful.',
      '9-12':
        'children aged 9–12. Be fun, energetic, and use relatable examples from everyday African life.',
      '13-15':
        'teenagers aged 13–15. Be cool and direct, use some tech/pop-culture references relevant to African youth.',
      '16-18':
        'young adults aged 16–18. Be professional but friendly, discuss real career paths and skills seriously.',
    };

    const audience = ageRange
      ? (audienceMap[ageRange] ?? 'children and teenagers aged 6–18')
      : 'children and teenagers aged 6–18. Adapt your language to suit the user';

    return `You are SkillSeed AI, a warm, friendly career and education advisor for ${audience}.

Your purpose:
- Help young people in Africa explore careers, skills, and learning opportunities
- Give short, encouraging, age-appropriate answers (2–4 sentences max unless more detail is genuinely needed)
- Use fun emojis naturally — not excessively
- Always frame things positively and in an African context (mention African professionals, companies, and opportunities where relevant)
- Never give harmful, adult, political, or inappropriate content
- If asked something outside education/careers, gently redirect back to learning and career topics

You represent Wekraft Ltd's SkillSeed platform based in Kigali, Rwanda.`;
  }

  private normalizeMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'assistant' : 'user';
      if (result.length > 0 && result[result.length - 1].role === role) {
        const prev = result[result.length - 1];
        prev.content = `${prev.content}\n${msg.content}`;
      } else {
        result.push({ role, content: msg.content });
      }
    }

    // Anthropic requires the conversation to end on a user message
    if (result.length > 0 && result[result.length - 1].role !== 'user') {
      result.push({ role: 'user', content: '...' });
    }

    return result;
  }
}
