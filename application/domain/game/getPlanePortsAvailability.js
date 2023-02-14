async (game, { joinPlaneId }) => {
  const joinPlane = game.getObjectById(joinPlaneId);
  const fakePlane = game.addPlane(joinPlane);
  const availablePorts = [];

  for (const fakePort of fakePlane.getObjects({ className: 'Port' })) {
    for (const fakePortDirect of Object.keys(fakePort.direct)) {
      fakePort.updateDirect(fakePortDirect);
      availablePorts.push(...game.getAvailablePortsToJoinPlane({ joinPort: fakePort }));
    }
  }

  return { status: 'ok', clearChanges: true, availablePorts };
};
