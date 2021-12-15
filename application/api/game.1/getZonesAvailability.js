({
  access: 'public',
  method: async ({ gameId, diceId }) => {
    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const dice = game.getObjectById(diceId);
    const updatedData = {zone: {}};
    game.getZonesAvailability(dice).forEach((status, zone)=>{
      updatedData.zone[zone._id] = {available: status};
    });
    
    context.client.emit('db/smartUpdated', updatedData);

    return { status: 'ok' };
  },
});
