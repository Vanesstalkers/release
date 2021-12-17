({
  access: 'public',
  method: async ({ gameId, joinPortId, targetPortId }) => {
    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const joinPort = game.getObjectById(joinPortId);
    const targetPort = game.getObjectById( targetPortId );
    game.linkPlanes({joinPort, targetPort});

    game.addPlane( joinPort.getParent() );

    // const updatedData = {zone: {}};
    // game.getZonesAvailability(dice).forEach((status, zone)=>{
    //   updatedData.zone[zone._id] = {available: status};
    // });
    
    // context.client.emit('db/smartUpdated', updatedData);

    domain.db.broadcastData({
      game: { [gameId]: game },
    });

    return { status: 'ok' };
  },
});
