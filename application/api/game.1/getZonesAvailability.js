({
  access: 'public',
  method: async ({ gameId, diceId }) => {
    const game = new domain.game.class({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const dice = game.getObjectById(diceId);

    if (!dice) return false;

    const currentZone = dice.getParent();
    const updatedData = { zone: {} };
    game.getZonesAvailability(dice).forEach((status, zone) => {
      if (zone != currentZone) {
        updatedData.zone[zone._id] = { available: status };
      }
    });

    context.client.emit('db/smartUpdated', updatedData);

    return { status: 'ok' };
  },
});
