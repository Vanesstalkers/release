({
  access: 'public',
  method: async ({ gameId, joinPortId, targetPortId, targetPortDirect, joinPortDirect }) => {

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const joinPort = game.getObjectById(joinPortId);
    const targetPort = game.getObjectById(targetPortId);
    joinPort.updateDirect(joinPortDirect);
    targetPort.updateDirect(targetPortDirect);
    game.linkPlanes({ joinPort, targetPort });

    // !!! тут надо удалить plane у старого родителя
    game.addPlane(joinPort.getParent());

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne(
      'game',
      { _id: db.mongo.ObjectID(gameId) },
      { $set }
    );

    domain.db.broadcastData({
      game: { [gameId]: game },
    });

    return { status: 'ok' };
  },
});
