import { lmStudioService } from './lm-studio'
import { quoteService, Quote } from './quote'
import { MODEL_PRESETS } from '@core/config/model-presets'

export type AnalysisPersonality = 'roast' | 'wholesome' | 'philosophical' | 'sarcastic' | 'professional' | 'drunk'

interface AnalysisOptions {
  personality?: AnalysisPersonality
  sampleSize?: number
}

interface QuoteAnalysis {
  summary: string
  personality: AnalysisPersonality
  quotesAnalyzed: number
  totalQuotes: number
}

const personalityPrompts: Record<AnalysisPersonality, string> = {
  roast:
    'Roast this person HARD. Example: "This mfer really said all that? Touch grass immediately. Absolute clown behavior, no cap."',
  wholesome:
    'Be their biggest cheerleader. Example: "What a precious bean! This person is literally sunshine in human form, must protect at all costs!"',
  philosophical:
    'Go full pretentious philosopher. Example: "One observes in this individual the eternal struggle between id and superego, a Sisyphean quest for meaning..."',
  sarcastic:
    'Maximum sarcasm and eye rolls. Example: "Oh wow, what a unique and special snowflake. Truly unprecedented levels of originality here. Groundbreaking."',
  professional:
    'Clinical psychologist mode. Example: "Subject exhibits classic symptoms of terminally online disorder with acute gaming addiction comorbidity."',
  drunk:
    'Write like youre HAMMERED. Example: "yooooo this persn is like... *hic* ...wait what? oh yeah theyre prolly cool or whateverrr... reminds me of my ex but like *burp* in a good way??"'
}

export class QuoteAnalyzerService {
  async analyzeUserQuotes(username: string, options: AnalysisOptions = {}): Promise<QuoteAnalysis | null> {
    const { personality = 'roast', sampleSize = 10 } = options

    // Get user stats and quotes
    const stats = await quoteService.getUserQuoteStats(username)

    if (stats.totalQuotes === 0) {
      return null
    }

    // Get a random sample of quotes
    const quotes = await quoteService.getQuotesForAnalysis(username, Math.min(sampleSize, stats.totalQuotes))

    // Build the analysis prompt
    const quotesText = quotes.map((q, i) => `${i + 1}. "${q.text}"`).join('\n')

    // For Mistral models, we need to embed the personality instruction in the user message
    const prompt = `${personalityPrompts[personality]}

I read ${stats.totalQuotes} things ${username} said in Twitch chat (includes emotes, memes, gaming slang). Here's some:

${quotesText}

Now describe what ${username} is like in that exact style. MAX 250 CHARACTERS! One sentence only! GO:`

    try {
      const modelPreset = MODEL_PRESETS.creative
      const response = await lmStudioService.generateCompletion(prompt, {
        model: modelPreset.modelName,
        // Don't use systemPrompt for Mistral models - it's embedded in the prompt
        temperature: personality === 'drunk' ? 1.2 : modelPreset.temperature,
        maxTokens: modelPreset.maxTokens
      })

      const summary = response.choices[0]?.message.content || 'Analysis failed'

      return {
        summary,
        personality,
        quotesAnalyzed: quotes.length,
        totalQuotes: stats.totalQuotes
      }
    } catch (error) {
      console.error('Quote analysis failed:', error)
      throw error
    }
  }

  getRandomPersonality(): AnalysisPersonality {
    const personalities = Object.keys(personalityPrompts) as AnalysisPersonality[]
    return personalities[Math.floor(Math.random() * personalities.length)]
  }

  getValidPersonalities(): AnalysisPersonality[] {
    return Object.keys(personalityPrompts) as AnalysisPersonality[]
  }
}

export const quoteAnalyzerService = new QuoteAnalyzerService()
