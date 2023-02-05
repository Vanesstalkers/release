({
  access: 'public',
  method: async ({
    gameId,
    joinPortId,
    targetPortId,
    targetPortDirect,
    joinPortDirect,
  }) => {
    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const joinPort = game.getObjectById(joinPortId);
    const joinPlane = joinPort.getParent();
    const targetPort = game.getObjectById(targetPortId);

    // тут нужна проверка getAvailablePortsToJoinPlane

    joinPort.updateDirect(joinPortDirect);
    targetPort.updateDirect(targetPortDirect);
    game.linkPlanes({ joinPort, targetPort });

    joinPlane.getParent().removeItem(joinPlane);
    joinPlane.getParent().deleteFromObjectStorage(joinPlane);
    game.addPlane(joinPlane);

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
