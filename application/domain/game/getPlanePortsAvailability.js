(game, { joinPlaneId }) => {
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

  // заменить на clientCustomUpdates не получится, в частности, из-за сложной логики с card-plane (например, при авторозыгрыше "req_*"-карты в начале игры)
  game.set({ availablePorts });
  if (availablePorts.length === 0) {
    const planeParent = joinPlane.getParent();
    if (game.status === 'PREPARE_START') {
      planeParent.removeItem(joinPlane, { deleteFromStorage: true });
      if (Object.keys(game.planeMap).length === 0) {
        // размещается первый plane на пустое поле
        game.addPlane(joinPlane);
      } else {
        // все port заблокированы, размещать plane некуда
        game.set({ noAvailablePorts: true });
        game.checkStatus({ cause: 'PLAYFIELD_CREATING' });
      }
    } else {
      if (!joinPlane.customClass.includes('card-plane')) {
        const planeDeck = game.getObjectByCode('Deck[plane]');
        joinPlane.moveToTarget(planeDeck);
      } else {
        planeParent.removeItem(joinPlane, { deleteFromStorage: true });
      }
    }
  }

  return { status: 'ok' };
};
