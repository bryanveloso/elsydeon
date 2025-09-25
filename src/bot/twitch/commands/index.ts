import { BotCommand } from '@twurple/easy-bot'
import { features } from './features.config'

// Core commands
import { cute } from './cute'
import { punt } from './punt'
import { slap } from './slap'

// Quote system
import { quote } from './quote'

// AI features
import { analyze } from './analyze'

// FFBot integration
import { ffrefresh, stats } from './ffbot'

// Campaign/Subathon
import {
  campaign,
  gifts,
  gifters,
  milestones,
  nextgoal,
  pausetimer,
  progress,
  starttimer,
  subathon,
  timer
} from './campaign'

// Honor commands
import { heykay, heymoral, heymyri } from './honors'

// Build command array based on features
const commandList: BotCommand[] = []

// Core commands
if (features.core) {
  commandList.push(cute, punt, slap)
}

// Quote system
if (features.quotes) {
  commandList.push(quote)
}

// AI features
if (features.ai) {
  commandList.push(analyze)
}

// FFBot integration
if (features.ffbot) {
  commandList.push(stats, ffrefresh)
}

// Campaign features
if (features.campaign) {
  commandList.push(
    campaign,
    subathon,
    milestones,
    nextgoal,
    timer,
    progress,
    starttimer,
    pausetimer,
    gifts,
    gifters
  )
}

// Honor commands
if (features.honors) {
  commandList.push(heykay, heymoral, heymyri)
}

// Export command registry
export const commands: BotCommand[] = commandList

// Log enabled features
console.log('[Commands] Enabled features:', Object.entries(features)
  .filter(([_, enabled]) => enabled)
  .map(([name]) => name)
  .join(', '))
