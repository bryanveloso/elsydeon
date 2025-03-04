import { createBotCommand } from '@twurple/easy-bot';

export const punt = createBotCommand(
  'punt',
  async (_, { msg: { userInfo }, action, timeout }) => {
    try {
      if (userInfo.isBroadcaster || userInfo.isMod) {
        action(
          `can't punt ${userInfo.displayName}! They're too kawaii~ avalonEYES`
        );
      } else {
        await timeout(1, 'Disrespected lalafells').catch(err => {
          console.error(`Failed to timeout user ${userInfo.displayName}:`, err);
          action(`tried to punt ${userInfo.displayName} but something went wrong!`);
          return;
        });
        
        action(
          `punted ${userInfo.displayName} for their disrespect, lalafell hater. avalonRAGE`
        );
      }
    } catch (error) {
      console.error('Error in punt command:', error);
      action('failed to execute the punt command properly!');
    }
  }
);