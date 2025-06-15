export interface ModelPreset {
  modelName: string;
  description: string;
  bestFor: string[];
  temperature: number;
  maxTokens: number;
}

export const MODEL_PRESETS: Record<string, ModelPreset> = {
  // Creative and personality-driven tasks
  creative: {
    modelName: 'dolphin-2.9.3-llama-3-8b',
    description: 'Uncensored model for creative, personality-driven responses',
    bestFor: ['quote analysis', 'roasts', 'entertainment', 'memes'],
    temperature: 0.9,
    maxTokens: 50
  },
  
  // Fast, real-time responses
  realtime: {
    modelName: 'phi-3-mini-128k-instruct',
    description: 'Ultra-fast for real-time chat analysis and moderation',
    bestFor: ['chat sentiment', 'quick reactions', 'moderation'],
    temperature: 0.3,
    maxTokens: 100
  },
  
  // Analytical and structured outputs
  analytical: {
    modelName: 'mistral-7b-instruct-v0.3',
    description: 'Balanced model for analysis and structured responses',
    bestFor: ['data analysis', 'summaries', 'reports'],
    temperature: 0.5,
    maxTokens: 200
  },
  
  // Gaming and strategy
  gaming: {
    modelName: 'deepseek-coder-v2-lite-instruct',
    description: 'Great for gaming strategies and structured JSON outputs',
    bestFor: ['game strategies', 'battle analysis', 'json formatting'],
    temperature: 0.4,
    maxTokens: 300
  },
  
  // Story and roleplay
  storytelling: {
    modelName: 'zephyr-7b-beta',
    description: 'Excellent for narratives and maintaining character',
    bestFor: ['stories', 'roleplay', 'character voices'],
    temperature: 0.9,
    maxTokens: 500
  },
  
  // General purpose fallback
  general: {
    modelName: 'llama-3.2-7b-instruct',
    description: 'Well-rounded model for general tasks',
    bestFor: ['general chat', 'Q&A', 'assistance'],
    temperature: 0.7,
    maxTokens: 250
  }
};

export function getModelForTask(task: string): ModelPreset {
  // Find the best model based on task keywords
  const taskLower = task.toLowerCase();
  
  for (const [key, preset] of Object.entries(MODEL_PRESETS)) {
    if (preset.bestFor.some(use => taskLower.includes(use))) {
      return preset;
    }
  }
  
  // Default to general purpose
  return MODEL_PRESETS.general;
}