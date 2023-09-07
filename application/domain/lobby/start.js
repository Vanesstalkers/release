async () => {
  lib.user.mainClass = domain.lobby.user;
  lib.user.sessionClass = domain.lobby.session;

  if (application.worker.id === 'W1') {
    db.mongo.handlers.afterStart.push(async () => {
      const lobby = new domain.lobby.class();
      const code = 'main';
      await lobby.load({ fromDB: { query: { code } } }).catch(async (err) => {
        if (err !== 'not_found') throw err; // любая ошибка, кроме ожидаемой "not_found";
        await lobby.create({ code });
      });

      try {
        const { Midjourney } = npm.midjourney;
        const client = new Midjourney(config.midjourney);
        await client.init();
        lobby.midjourneyClient(client);
      } catch (err) {
        console.log(err);
      }
      const TelegramBot = npm['node-telegram-bot-api'];
      const bot = new TelegramBot(config.telegram.botToken, { polling: true });
      await bot
        .setMyCommands([
          {
            command: '/games',
            description: 'Список игр',
          },
          {
            command: '/watch',
            description: 'Отслеживать новый игры',
          },
        ])
        .then(() => {
          console.log('TelegramBot started.');
        })
        .catch((err) => {
          console.error('!!! TelegramAPI setMyCommands error');
          throw err?.message;
        });
      bot.onText(/\/watch(@|\s|\b)(?!\w)/, async (msg, match) => {
        const {
          from: { id, username, is_bot },
        } = msg;

        if (is_bot) return;
        await lobby.startWatching({ telegramId: id, telegramUsername: username });
      });
      lobby.telegramBot(bot);
    });
  }
};
