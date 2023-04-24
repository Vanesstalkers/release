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
      if (!helper && !finishedTutorials['tutorialGameStart']) {
        // helper = Object.values(domain.game['tutorialGameStart']).find(({ initialStep }) => initialStep);
        // helperLinks = {
        //   'game1': { selector: '.player.iam .player-hands', tutorial: 'tutorialLobbyStart', type: 'game' },
        //   'game2': { selector: '.deck-active', tutorial: 'tutorialMenu', type: 'game' },
        // };
        // repoUser.currentTutorial = { active: 'tutorialGameStart' };
        repoUser.helper = helper;
        repoUser.helperLinks = helperLinks;
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
