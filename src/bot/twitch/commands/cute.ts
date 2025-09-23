import { createBotCommand } from '@twurple/easy-bot'

export const cute = createBotCommand('cute', (params, { msg: { userInfo }, say }) => {
  // Use the first parameter as the username, or default to the user who called the command
  const username = params[0] || userInfo.displayName

  if (username.toLowerCase() === 'elsydeon') {
    say('avalonREVERSE')
    return
  }

  say(`${username} is cute, pass it on.`)
})
