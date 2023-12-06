import { createBotCommand } from "@twurple/easy-bot";

export const punt = createBotCommand('punt', async (_, { msg: {userInfo}, action, timeout }) => {
  if (userInfo.isBroadcaster || userInfo.isMod) {
    action(`can't punt ${userInfo.displayName}! They're too kawaii~ avalonEYES`)
  } else {
    await timeout(1, 'Disrespected lalafells.')
    action(`punted ${userInfo.displayName} for your disrespect, lalafell hater. avalonRAGE`)
  }
})
