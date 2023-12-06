import { createBotCommand } from '@twurple/easy-bot';

export const slap = createBotCommand(
  'slap',
  async (params, { msg: { userInfo }, action }) => {
    const target = params.join(' ');
    if (target) {
      action(`slaps ${target} around a bit with a large trout. 🐟`);
    } else {
      action(
        `slaps ${userInfo.displayName} around a bit with a large trout. 🐟`
      );
    }
  }
);
