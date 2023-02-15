async (game, { joinPlaneId }) => {
  const availablePorts = [];

  game.disableChanges();
  {
    const joinPlane = game.getObjectById(joinPlaneId);
    const fakePlane = game.addPlane(joinPlane);

    for (const fakePort of fakePlane.getObjects({ className: 'Port' })) {
      for (const fakePortDirect of Object.keys(fakePort.direct)) {
        fakePort.updateDirect(fakePortDirect);
        availablePorts.push(...game.getAvailablePortsToJoinPlane({ joinPort: fakePort }));
      }
    }
  }
  game.acceptChanges();

  game.set('availablePorts', availablePorts);

  return { status: 'ok' };
};
