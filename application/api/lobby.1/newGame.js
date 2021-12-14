({
  access: 'public',
  method: async () => {
    async function newGame() {
      const Game = domain.game.class();
      const game = new Game().fromJSON(domain.game.exampleJSON);

      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[1]'),
        targetPort: game.getObjectByCode('Plane[1]').getObjectByCode('Port[1]'),
      });
      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[3]').getObjectByCode('Port[2]'),
        targetPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[4]'),
      });

      const insertOne = await db.mongo.insertOne('game', game);
      game._id = insertOne._id;

      return { result: 'success', gameId: game._id };
    }

    const { gameId } = await newGame();
    const game = await db.mongo.findOne('game', gameId);

    domain.db.data.game[game._id] = game;
    domain.db.forms.lobby.__game[game._id] = {};
    domain.db.broadcast({
      room: 'lobby',
      data: { lobby: domain.db.forms.lobby },
      event: ({ client }) => {
        domain.db.subscribe({
          name: 'game-' + game._id,
          client,
          type: 'lobby',
        });
        client.emit('db/updated', { game: { [game._id]: game } });
      },
    });

    return { result: 'success', gameId };
  },
});
