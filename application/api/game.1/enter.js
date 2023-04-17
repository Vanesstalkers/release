({
  access: 'public',
  method: async ({ gameId }) => {
    try {
      const userId = context.client.userId;
      const game = lib.repository.getCollection('game').get(gameId);
      if (!game) throw new Error('Game not found');
      if (game.finished) throw new Error('Game finished');

      const repoUser = lib.repository.user[userId];
      let { helper = null, finishedTutorials = {} } = repoUser;
      const data = game.prepareFakeData({
        userId,
        data: { ...game.store, game: { [gameId]: { ...game, store: undefined } } },
      });
      if (!helper && !finishedTutorials['tutorialGameStart']) {
        helper = Object.values(domain.game['tutorialGameStart']).find(({ initialStep }) => initialStep);
        repoUser.currentTutorial = { active: 'tutorialGameStart' };
        repoUser.helper = helper;
      }
      if (helper) data.user = { [userId]: { helper } };
      context.client.emit('db/smartUpdated', data);

      lib.broadcaster.subscribe({ room: `game-${gameId}`, client: context.client });

      return { status: 'ok' };
    } catch (err) {
      console.log(err);
      return { status: 'err', message: err.message };
    }
  },
});
