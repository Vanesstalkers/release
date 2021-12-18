({
  access: 'public',
  method: async ({ gameId, targetPortId }) => {

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );

    const targetPort = game.getObjectById(targetPortId);
    const fakePlane = game.addPlane(targetPort.getParent());

    const availablePorts = [];
    fakePlane.getObjects({ className: 'Port' }).forEach(fakePort => {
      Object.keys(fakePort.direct).forEach(fakePortDirect => {
        fakePort.updateDirect(fakePortDirect);
        game.getObjects({ className: 'Plane', directParent: game }).forEach(plane => {
          if(plane === fakePlane) return;
          plane.getObjects({ className: 'Port' }).forEach(port => {
            if (!port.linkedBridge) {
              Object.keys(port.direct).forEach(portDirect => {
                port.updateDirect(portDirect);
                const fakePlane = fakePort.getParent();
                game.linkPlanes({ joinPort: fakePort, targetPort: port, fake: true });
                const checkPlaneCollysion = game.checkPlaneCollysion(fakePlane);
                if (checkPlaneCollysion.collysionList.length === 0) {
                  availablePorts.push({
                    joinPortId: fakePort._id,
                    joinPortDirect: fakePortDirect,
                    targetPortId: port._id,
                    targetPortDirect: portDirect,
                    position: checkPlaneCollysion.planePosition,
                  })
                }
              });
            }
          });
        });
      });
    });

    return { status: 'ok', availablePorts };
  },
});
