async (game, { joinPlaneId }) => {
  const availablePorts = [];
  const joinPlane = game.getObjectById(joinPlaneId);

  game.disableChanges();
  {
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
  if (availablePorts.length === 0) game.removePlane(joinPlane);

  return { status: 'ok' };
};
