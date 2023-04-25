({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const userId = context.client.userId;
      const game = lib.repository.getCollection('game').get(gameId);
      if (!game) throw new Error('Game not found');
      if (game.finished) throw new Error('Game finished');

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
          data: { ...game.store, game: { [gameId]: { ...game, store: undefined } } },
        });
      } catch (err) {
        // !!! нужно выяснить, в каких случаях возникают проблемы с первичным наполнением игры
        await game.updateStatus();
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
