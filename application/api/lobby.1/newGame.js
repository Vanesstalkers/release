({
  access: 'public',
  method: async ({ type }) => {
    const gameJSON = domain.game.exampleJSON[type];
    if (!gameJSON) return;
    const gameData = lib.utils.structuredClone(gameJSON);
    const _id = db.mongo.ObjectID();
    const gameId = _id.toString();
    const game = new domain.game.class({ _id }).fromJSON(gameData, { newGame: true });
    await db.mongo.insertOne('game', game);
    lib.repository.getCollection('game').set(gameId, game);
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

    return { status: 'ok', gameId };
  },
});
