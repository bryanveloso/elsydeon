import { createBotCommand } from '@twurple/easy-bot'
import { ffbotService } from '@core/services/ffbot'
import { toSuperscript } from '@core/utils/superscript'

export const ffbot = createBotCommand('ffbot', async (_, { say }) => {
  const metadata = ffbotService.getMetadata()

  if (!metadata) {
    say('FFBot data is not available at the moment.')
    return
  }

  const { cycle, season } = metadata

  say(`🎮 FFBot - Season ${season}, Cycle ${cycle} | `)
})

export const stats = createBotCommand('stats', async (params, { msg: { userInfo }, say }) => {
  // If no args, look up the user who sent the command
  // If one arg, look up that username (stripping @ if present)
  let targetUser = params.length > 0 ? params[0] : userInfo.displayName
  
  // Strip @ from the beginning if present
  if (targetUser.startsWith('@')) {
    targetUser = targetUser.substring(1)
  }

  const playerStats = ffbotService.getPlayerStats(targetUser)

  if (!playerStats) {
    say(`No stats found for ${targetUser}.`)
    return
  }

  const { lv, ascension, hp, atk, mag, spi, unit, wins, esper, m1 } = playerStats

  // Calculate how old the data is
  const fileModTime = ffbotService.getFileModifiedTime()
  let ageText = ''
  if (fileModTime) {
    const ageMinutes = Math.floor((Date.now() - fileModTime.getTime()) / 60000)
    if (ageMinutes < 1) {
      ageText = '(data is current)'
    } else if (ageMinutes === 1) {
      ageText = '(data is 1 minute old)'
    } else {
      ageText = `(data is ${ageMinutes} minutes old)`
    }
  }

  say(
    `📊 ${targetUser} ${wins >= 100 ? '↗️' : ''} | Lv${lv.toLocaleString()} ${unit} | ` +
      `HP: ${hp.toLocaleString()} ATK: ${atk.toLocaleString()} MAG: ${mag.toLocaleString()} SPI: ${spi.toLocaleString()} | ` +
      `Wins: ${wins} | Esper: ${esper} | Job: ${m1} | ${ageText}`
  )
})

export const ffrefresh = createBotCommand('ffrefresh', async (_, { msg: { userInfo }, say }) => {
  if (!userInfo.isMod && !userInfo.isBroadcaster) {
    return
  }

  await ffbotService.forceRefresh()
  const lastRefresh = ffbotService.getLastRefresh()

  if (lastRefresh) {
    say(`✅ FFBot data refreshed at ${lastRefresh.toLocaleTimeString()}`)
  } else {
    say('❌ Failed to refresh FFBot data')
  }
})
