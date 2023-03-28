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

  // переделать на callEventHandlers({ handler: 'addPlane'})
  // if (Object.keys(game.planeMap).length === 0) game.addPlane(joinPlane); // начало игры с planesAtStart=0

  game.set('availablePorts', availablePorts);
  if (availablePorts.length === 0){
    // !!! сделать через возврат в deck (кроме card-plane)
    // -- game.getStore().plane[itemId].moveToTarget(gameDeck);
    game.removePlane(joinPlane);
  }

  return { status: 'ok' };
};
