import { createBotCommand } from '@twurple/easy-bot'

export const heykay = createBotCommand('heykay', async (_, { say }) => {
  say('The Kay Says: REMEMBER TO SAVE! avalonPOINT')
})

export const heymoral = createBotCommand('heymoral', async (_, { say }) => {
  say('The Moral Says: Chat is cute. avalonOWO')
})

export const heymyri = createBotCommand('heymyri', async (_, { say }) => {
  say('The Myri Says: PSIONS. STOP SPLITTING. PSIONS. STOP SPLITTING. PSIONS. STOP SPLITTING. PSIONS. STOP SPLITTING. STOP. STOP. STOP. avalonRAGE')
})
