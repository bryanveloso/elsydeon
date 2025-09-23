import { createBotCommand } from '@twurple/easy-bot'
import { campaignService } from '@core/services/campaign'

/**
 * Show current campaign status and progress
 */
export const campaign = createBotCommand('campaign', async (_, { say }) => {
  const message = await campaignService.getStatusMessage()
  say(message)
})

/**
 * Alias for campaign command
 */
export const subathon = createBotCommand('subathon', async (_, { say }) => {
  const message = await campaignService.getStatusMessage()
  say(message)
})

/**
 * Show milestone progress
 */
export const milestones = createBotCommand('milestones', async (_, { say }) => {
  const message = await campaignService.getMilestonesMessage()
  say(message)
})

/**
 * Show next milestone
 */
export const nextgoal = createBotCommand('nextgoal', async (_, { say }) => {
  const campaign = await campaignService.getActiveCampaign()

  if (!campaign) {
    say('No active campaign at the moment.')
    return
  }

  const nextMilestone = campaign.milestones.find(m => !m.is_unlocked)

  if (!nextMilestone) {
    say('🎉 All milestones have been unlocked!')
    return
  }

  say(`🎯 Next Goal: "${nextMilestone.title}" at ${nextMilestone.threshold} - ${nextMilestone.description}`)
})

/**
 * Show subathon timer status
 */
export const timer = createBotCommand('timer', async (_, { say }) => {
  const message = await campaignService.getTimerMessage()
  say(message)
})

/**
 * Start the subathon timer (mod only)
 */
export const starttimer = createBotCommand('starttimer', async (_, { msg: { userInfo }, say }) => {
  // Check permissions
  if (!userInfo.isMod && !userInfo.isBroadcaster) {
    return // Silent failure for non-mods
  }

  const result = await campaignService.startTimer()

  if (result.success) {
    say(`✅ ${result.message}`)
  } else {
    say(`❌ ${result.message}`)
  }
})

/**
 * Pause the subathon timer (mod only)
 */
export const pausetimer = createBotCommand('pausetimer', async (_, { msg: { userInfo }, say }) => {
  // Check permissions
  if (!userInfo.isMod && !userInfo.isBroadcaster) {
    return // Silent failure for non-mods
  }

  const result = await campaignService.pauseTimer()

  if (result.success) {
    say(`⏸️ ${result.message}`)
  } else {
    say(`❌ ${result.message}`)
  }
})

/**
 * Get campaign progress summary
 */
export const progress = createBotCommand('progress', async (_, { say }) => {
  const campaign = await campaignService.getActiveCampaign()

  if (!campaign) {
    say('No active campaign at the moment.')
    return
  }

  const { metric, milestones } = campaign
  const unlockedCount = milestones.filter(m => m.is_unlocked).length
  const progressPercent = milestones.length > 0
    ? Math.round((unlockedCount / milestones.length) * 100)
    : 0

  let message = `📈 Campaign Progress: ${progressPercent}% (${unlockedCount}/${milestones.length} milestones) | `
  message += `${metric.total_subs} subs, ${metric.total_bits} bits`

  say(message)
})
