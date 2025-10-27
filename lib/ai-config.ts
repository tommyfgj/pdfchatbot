import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export type AIProvider = 'openai' | 'deepseek' | 'custom' | 'azure';

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
  azure: {
    provider: 'azure',
    model: 'gpt-4o', // Azure 部署名称，可通过环境变量覆盖
    displayName: 'Azure OpenAI',
  },
  custom: {
    provider: 'custom',
    model: 'gpt-3.5-turbo', // 默认模型，可通过环境变量覆盖
    displayName: 'Custom OpenAI Compatible',
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

    case 'azure':
      const azure = createAzure({
        resourceName: process.env.AZURE_RESOURCE_NAME, // Azure 资源名称
        apiKey: process.env.AZURE_API_KEY, // Azure API Key
      });
      const azureModel = process.env.AZURE_DEPLOYMENT_NAME || AI_CONFIGS.azure.model;
      return azure(azureModel);

    case 'custom':
      const customProvider = createOpenAICompatible({
        name: 'custom-openai',
        apiKey: process.env.CUSTOM_API_KEY || process.env.OPENAI_API_KEY,
        baseURL: process.env.CUSTOM_BASE_URL,
      });
      const customModel = process.env.CUSTOM_MODEL || AI_CONFIGS.custom.model;
      return customProvider(customModel);

    default:
      // 默认使用 DeepSeek
      const defaultDeepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      return defaultDeepseek(AI_CONFIGS.deepseek.model);
  }
}
