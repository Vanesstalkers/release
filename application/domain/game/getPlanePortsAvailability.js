async (game, { joinPlaneId }) => {
  const joinPlane = game.getObjectById(joinPlaneId);
  const fakePlane = game.addPlane(joinPlane);
  const availablePorts = [];

  fakePlane.getObjects({ className: 'Port' }).forEach((fakePort) => {
    Object.keys(fakePort.direct).forEach((fakePortDirect) => {
      fakePort.updateDirect(fakePortDirect);
      availablePorts.push(
        ...game.getAvailablePortsToJoinPlane({ joinPort: fakePort })
      );
    });
  });

  return { status: 'ok', clearChanges: true, availablePorts };
};
