import { createBotCommand } from '@twurple/easy-bot'
import { quoteAnalyzerService, AnalysisPersonality } from '@core/services/quote-analyzer'

// Command to analyze user quotes:
// !analyze - analyze your own quotes with random personality
// !analyze <username> - analyze someone's quotes with random personality
// !analyze <username> <personality> - analyze with specific personality
// Personalities: roast, wholesome, philosophical, sarcastic, professional, drunk

export const analyze = createBotCommand('analyze', async (params, { say, msg: { userInfo } }) => {
  try {
    let username: string;
    let personality: AnalysisPersonality;
    const validPersonalities = quoteAnalyzerService.getValidPersonalities();
    
    if (params.length === 0) {
      // Analyze self with random personality
      username = userInfo.displayName;
      personality = quoteAnalyzerService.getRandomPersonality();
    } else if (params.length === 1) {
      // Check if it's a personality for self
      if (validPersonalities.includes(params[0] as AnalysisPersonality)) {
        username = userInfo.displayName;
        personality = params[0] as AnalysisPersonality;
      } else {
        // It's a username with random personality
        username = params[0];
        personality = quoteAnalyzerService.getRandomPersonality();
      }
    } else {
      // Username and personality specified
      username = params[0];
      personality = validPersonalities.includes(params[1] as AnalysisPersonality) 
        ? params[1] as AnalysisPersonality 
        : quoteAnalyzerService.getRandomPersonality();
    }
    
    // Clean up username (remove @ if present)
    username = username.replace('@', '');
    
    say(`🔍 Analyzing ${username}'s quotes with ${personality} mode...`);
    
    // Add timeout handler
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    let analysis;
    try {
      analysis = await Promise.race([
        quoteAnalyzerService.analyzeUserQuotes(username, {
          personality,
          sampleSize: 25
        }),
        timeoutPromise
      ]);
    } catch (error: any) {
      if (error.message === 'Timeout') {
        say('The AI is taking too long to think... try again later!');
      } else {
        console.error('Error in analyze command:', error);
        say('The AI had a stroke trying to analyze those quotes. Try again later!');
      }
      return;
    }
    
    if (!analysis) {
      say(`No quotes found for ${username}. They must be the strong, silent type.`);
      return;
    }
    
    // Clean up the summary - remove any line breaks and trim length
    const cleanSummary = analysis.summary.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Format the response and ensure it fits in Twitch's 480 char limit
    const prefix = `📊 ${username} (${analysis.quotesAnalyzed}/${analysis.totalQuotes} quotes): `;
    const maxSummaryLength = 480 - prefix.length;
    const truncatedSummary = cleanSummary.length > maxSummaryLength 
      ? cleanSummary.substring(0, maxSummaryLength - 3) + '...'
      : cleanSummary;
    
    say(prefix + truncatedSummary);
    
  } catch (error) {
    console.error('Error in analyze command:', error);
    say('Something went wrong with the analyze command.');
  }
});
