({
  access: 'public',
  method: async ({ gameId, joinPlaneId }) => {

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const joinPlane = game.getObjectById(joinPlaneId);
    const fakePlane = game.addPlane(joinPlane);

    let availablePorts = [];
    fakePlane.getObjects({ className: 'Port' }).forEach(fakePort => {
      Object.keys(fakePort.direct).forEach(fakePortDirect => {
        fakePort.updateDirect(fakePortDirect);
        availablePorts = availablePorts.concat(
          game.getAvailablePortsToJoinPlane({
            joinPort: fakePort,
          })
        );
      });
    });

    return { status: 'ok', availablePorts };
  },
});
