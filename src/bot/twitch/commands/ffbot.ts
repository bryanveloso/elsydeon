import { createBotCommand } from '@twurple/easy-bot'
import { ffbotService } from '@core/services/ffbot'

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

  // Small delay to allow game to update the database
  await new Promise(resolve => setTimeout(resolve, 500))

  const playerStats = await ffbotService.getPlayerStats(targetUser)

  if (!playerStats) {
    say(`No stats found for ${targetUser}.`)
    return
  }

  const { lv, ascension, hp, atk, mag, spi, unit, wins, card_passive, preferedstat, m1, m2, m3, m4, m5, m6, m7 } = playerStats

  // Collect all jobs/masteries
  const jobSlots = [m1, m2, m3, m4, m5, m6, m7].filter(job => job && job !== '')
  const jobDisplay = jobSlots.length > 0 ? jobSlots.join(' / ') : 'None'

  // Format stats with preferred stat marked (skip if "none")
  const pref = (preferedstat || '').toLowerCase().replace(/"/g, '')
  const hpDisplay = pref === 'hp' ? `${hp.toLocaleString()}*` : hp.toLocaleString()
  const atkDisplay = pref === 'atk' ? `${atk.toLocaleString()}*` : atk.toLocaleString()
  const magDisplay = pref === 'mag' ? `${mag.toLocaleString()}*` : mag.toLocaleString()
  const spiDisplay = pref === 'spi' ? `${spi.toLocaleString()}*` : spi.toLocaleString()

  say(
    `📊 ${targetUser} ${wins >= 100 ? '↗️' : ''} | Lv${lv.toLocaleString()} ${unit} | ` +
      `HP: ${hpDisplay} ATK: ${atkDisplay} MAG: ${magDisplay} SPI: ${spiDisplay} | ` +
      `Wins: ${wins} | Card: ${card_passive || 'None'} | Jobs: ${jobDisplay}`
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
