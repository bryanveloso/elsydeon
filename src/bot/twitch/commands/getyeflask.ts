import { createBotCommand } from '@twurple/easy-bot'

export const getyeflask = createBotCommand('getyeflask', (params, { msg: { userInfo }, say }) => {
  say(`WorldFriendshopBot didn't leave me any flasks in their will, ${userInfo.displayName} bardSadge `)
})
