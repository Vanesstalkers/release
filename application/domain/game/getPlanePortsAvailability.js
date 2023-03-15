async (game, { joinPlaneId }) => {
  const availablePorts = [];

  game.disableChanges();
  {
    const joinPlane = game.getObjectById(joinPlaneId);

    for (const joinPort of joinPlane.getObjects({ className: 'Port' })) {
      const realDirect = joinPort.getDirect();
      for (const portDirect of Object.keys(joinPort.direct)) {
        joinPort.updateDirect(portDirect);
        availablePorts.push(...game.getAvailablePortsToJoinPlane({ joinPort }));
      }
      joinPort.updateDirect(realDirect);
    }
  }
  game.enableChanges();

  game.set('availablePorts', availablePorts);

  return { status: 'ok' };
};
