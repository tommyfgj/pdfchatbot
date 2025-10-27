import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAzure } from '@ai-sdk/azure';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';

export const runtime = 'edge';

// 配置 AI 提供商
function getAIModel() {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  console.log('getAIModel - Provider:', provider);

  switch (provider) {
    case 'deepseek':
      console.log('Using DeepSeek provider');
      // DeepSeek 使用 OpenAI 兼容接口
      // 官方文档: https://platform.deepseek.com/api-docs/
      const deepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',  // OpenAI 兼容端点
      });
      // 可用模型: deepseek-chat, deepseek-coder
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      console.log('DeepSeek model:', model);
      return deepseek(model);

    case 'openai':
      console.log('Using OpenAI provider');
      return openai('gpt-4o-mini');

    case 'azure':
      console.log('Using Azure OpenAI provider');
      const azureResourceName = process.env.AZURE_RESOURCE_NAME;
      const azureApiKey = process.env.AZURE_API_KEY;
      const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o';
      
      console.log('Azure config:', {
        resourceName: azureResourceName,
        deploymentName: azureDeploymentName,
        apiKey: azureApiKey ? `${azureApiKey.substring(0, 10)}...` : 'undefined'
      });

      const azure = createAzure({
        resourceName: azureResourceName,
        apiKey: azureApiKey,
      });
      return azure(azureDeploymentName);

    case 'custom':
      console.log('Using Custom provider (OpenAI Compatible)');
      const customBaseURL = process.env.CUSTOM_BASE_URL;
      const customModel = process.env.CUSTOM_MODEL || 'gpt-3.5-turbo';
      const customApiKey = process.env.CUSTOM_API_KEY || process.env.OPENAI_API_KEY;
      
      console.log('Custom config:', {
        baseURL: customBaseURL,
        model: customModel,
        apiKey: customApiKey ? `${customApiKey.substring(0, 10)}...` : 'undefined'
      });

      // 使用 OpenAI Compatible provider，支持标准 OpenAI API v1
      const customProvider = createOpenAICompatible({
        name: 'custom-openai',
        apiKey: customApiKey,
        baseURL: customBaseURL,
      });
      return customProvider(customModel);

    default:
      console.log('Using default DeepSeek provider');
      // 默认使用 DeepSeek
      const defaultDeepseek = createOpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
      const defaultModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
      console.log('Default DeepSeek model:', defaultModel);
      return defaultDeepseek(defaultModel);
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 打印配置信息
  const provider = process.env.AI_PROVIDER || 'deepseek';
  console.log('=== AI Chat Request ===');
  console.log('Provider:', provider);
  console.log('CUSTOM_BASE_URL:', process.env.CUSTOM_BASE_URL);
  console.log('CUSTOM_MODEL:', process.env.CUSTOM_MODEL);
  console.log('CUSTOM_API_KEY:', process.env.CUSTOM_API_KEY ? `${process.env.CUSTOM_API_KEY.substring(0, 10)}...` : 'undefined');
  console.log('Messages:', JSON.stringify(messages, null, 2));

  try {
    const model = getAIModel();
    console.log('Model created successfully');

    const result = await streamText({
      model,
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

    console.log('StreamText created successfully');
    
    // AI SDK 5: 手动构建数据流响应以兼容前端
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const textPart of result.textStream) {
            // 使用前端期望的格式: 0:"text"
            const data = `0:${JSON.stringify(textPart)}\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('=== AI Chat Error ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}
