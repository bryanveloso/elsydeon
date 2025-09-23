import { createBotCommand } from '@twurple/easy-bot'

export const cute = createBotCommand('cute', (params, { msg: { userInfo }, say }) => {
  // Join all parameters for multi-word phrases, or default to the user who called the command
  const username = params.length > 0 ? params.join(' ') : userInfo.displayName

  if (username.toLowerCase() === 'elsydeon') {
    say('avalonREVERSE')
    return
  }

  say(`${username} is cute, pass it on.`)
})
