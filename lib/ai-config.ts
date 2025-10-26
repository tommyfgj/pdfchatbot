import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';

export type AIProvider = 'openai' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  displayName: string;
}

export const AI_CONFIGS: Record<AIProvider, AIConfig> = {
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
  },
};

export function getAIModel(provider?: string) {
  const selectedProvider = (provider || process.env.AI_PROVIDER || 'deepseek') as AIProvider;

  switch (selectedProvider) {
    case 'deepseek':
      const deepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      return deepseek(AI_CONFIGS.deepseek.model);

    case 'openai':
      return openai(AI_CONFIGS.openai.model);

    default:
      // 默认使用 DeepSeek
      const defaultDeepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      return defaultDeepseek(AI_CONFIGS.deepseek.model);
  }
}
