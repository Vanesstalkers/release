({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const userId = context.client.userId;
      const game = lib.repository.getCollection('game').get(gameId);
      if (!game) throw new Error('Игра не найдена.');
      if (game.finished) throw new Error('Игра уже завершена.');

      const repoUser = lib.repository.user[userId];
      let { helper = null, helperLinks = {}, finishedTutorials = {} } = repoUser;

      const startTutorial = Object.keys(game.playerMap).length > 1 ? 'tutorialGameStart' : 'tutorialGameSingleStart';
      if (!helper && !finishedTutorials[startTutorial]) {
        helper = Object.values(domain.game[startTutorial]).find(({ initialStep }) => initialStep);
        repoUser.helper = helper;
        repoUser.currentTutorial = { active: startTutorial };
        lib.timers.timerRestart(game, { time: 60 });
      }
      if (Object.keys(helperLinks).length === 0) {
        helperLinks = {
          planeControls: {
            selector: '.gameplane-controls',
            tutorial: 'tutorialGameLinks',
            type: 'game',
            pos: { top: false, left: false },
          },
          handPlanes: {
            selector: '.hand-planes',
            tutorial: 'tutorialGameLinks',
            type: 'game',
            pos: { top: true, left: true },
          },
          cardActive: {
            selector: '[code="Deck[card_active]"] .card-event',
            tutorial: 'tutorialGameLinks',
            type: 'game',
            pos: { top: false, left: true },
          },
        };
        repoUser.helperLinks = helperLinks;
      }

      let data;
      try {
        data = game.prepareFakeData({
          userId,
          data: { ...game.store, game: { [gameId]: { ...game, store: undefined } }, logs: game.logs },
        });
      } catch (err) {
        // !!! нужно выяснить, в каких случаях возникают проблемы с первичным наполнением игры
        game.updateStatus();
        throw err;
      }

      data.user = { [userId]: { helper, helperLinks } };
      context.client.emit('db/smartUpdated', data);

      lib.broadcaster.subscribe({ room: `game-${gameId}`, client: context.client });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
