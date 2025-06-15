import { 
  CompletionOptions, 
  CompletionRequest, 
  CompletionResponse, 
  LMStudioConfig,
  Message,
  StreamChunk 
} from '@core/types/lm-studio';

export class LMStudioService {
  private config: LMStudioConfig;

  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const defaultUrl = isDevelopment 
      ? 'http://localhost:1234/v1' 
      : 'http://saya.local:1234/v1';
    
    this.config = {
      apiUrl: process.env.LM_STUDIO_API_URL || defaultUrl,
      apiKey: process.env.LM_STUDIO_API_KEY,
      model: process.env.LM_STUDIO_MODEL || 'llama-3.2-3b-instruct'
    };
    
    console.log(`LM Studio configured for ${this.config.apiUrl}`);
  }

  async generateCompletion(
    prompt: string, 
    options?: CompletionOptions & { model?: string }
  ): Promise<CompletionResponse> {
    const messages: Message[] = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: CompletionRequest = {
      model: options?.model || this.config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      top_p: options?.topP,
      top_k: options?.topK,
      stream: false,
      stop: options?.stop
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling LM Studio API:', error);
      throw error;
    }
  }

  async *streamCompletion(
    prompt: string, 
    options?: CompletionOptions & { model?: string }
  ): AsyncGenerator<string> {
    const messages: Message[] = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: CompletionRequest = {
      model: options?.model || this.config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      top_p: options?.topP,
      top_k: options?.topK,
      stream: true,
      stop: options?.stop
    };

    try {
      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const chunk: StreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming from LM Studio API:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/models`, {
        headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to LM Studio:', error);
      return false;
    }
  }

  getConfig(): LMStudioConfig {
    return { ...this.config };
  }
}

export const lmStudioService = new LMStudioService();