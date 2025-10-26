import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const runtime = 'edge';

// 配置 AI 提供商
function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'deepseek';

  switch (provider) {
    case 'deepseek':
      // DeepSeek 使用 OpenAI 兼容接口
      // 官方文档: https://platform.deepseek.com/api-docs/
      const deepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',  // OpenAI 兼容端点
      });
      // 可用模型: deepseek-chat, deepseek-coder
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      return deepseek(model);

    case 'openai':
      return openai('gpt-4o-mini');

    default:
      // 默认使用 DeepSeek
      const defaultDeepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      const defaultModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      return defaultDeepseek(defaultModel);
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: getAIModel(),
    messages,
    system: `你是一个专业的 PDF 阅读助手。你的任务是帮助用户理解 PDF 文档中的内容。
    
当用户选择文本并提问时，你应该：
1. 清晰、准确地解释所选内容
2. 提供相关的背景知识
3. 如果是专业术语，给出简单易懂的解释
4. 如果是复杂概念，可以举例说明
5. 保持回答简洁但全面

请用中文回答，语气友好专业。`,
  });

  return result.toDataStreamResponse();
}
