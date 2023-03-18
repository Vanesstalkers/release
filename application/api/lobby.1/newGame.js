({
  access: 'public',
  method: async () => {
    async function newGame() {
      const gameType = 'duel-blitz';
      // const gameType = 'ffa-blitz';
      // const gameType = 'single-blitz';
      const gameData = lib.utils.structuredClone(domain.game.exampleJSON[gameType]);
      const game = await new domain.game.class().fromJSON(gameData, { newGame: true });
      const insertOne = await db.mongo.insertOne('game', game);
      game._id = insertOne._id;
      return { result: 'success', game };
    }

    const { game } = await newGame();
    const { _id: gameId } = game;

    domain.db.data.game[gameId] = game;
    domain.db.forms.lobby.__game[gameId] = {};
    domain.db.broadcast({
      room: 'lobby',
      data: { lobby: domain.db.forms.lobby },
      event: ({ client }) => {
        domain.db.subscribe({ name: 'game-' + gameId, client, type: 'lobby' });
        client.emit('db/updated', { game: { [gameId]: game } });
      },
    });

    return { result: 'success', gameId };
  },
});
