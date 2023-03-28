({
  access: 'public',
  method: async ({ type }) => {
    const gameJSON = domain.game.exampleJSON[type];
    if (!gameJSON) return;
    const gameData = lib.utils.structuredClone(gameJSON);
    const game = await new domain.game.class().fromJSON(gameData, { newGame: true });
    const insertOne = await db.mongo.insertOne('game', game);
    const gameId = insertOne._id.toString();
    game._id = gameId;
    lib.repository.getCollection('game').set(gameId, game);
    lib.broadcaster.addChannel({ name: `game-${gameId}`, instance: game });
    lib.repository
      .getCollection('lobby')
      .get('main')
      .addGame({ _id: game._id, round: game.round, status: game.status, playerList: game.getPlayerList() });
    // lib.broadcaster.pubClient.publish(
    //   `lobby-main`,
    //   JSON.stringify({
    //     eventName: 'addGame',
    //     eventData: { _id: game._id, round: game.round, status: game.status, playerList: game.getPlayerList() },
    //   })
    // );

    return { status: 'ok' };
  },
});
