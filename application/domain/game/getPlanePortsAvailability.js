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

  // (??? уже не помню зачем и как) переделать на callEventHandlers({ handler: 'addPlane'})

  // заменить на clientCustomUpdates не получится, в частности, из-за сложной логики с card-plane (например, при авторозыгрыше "req_*"-карты в начале игры)
  game.set({ availablePorts });
  if (availablePorts.length === 0) {
    const planeParent = joinPlane.getParent();
    if (game.status === 'prepareStart') {
      planeParent.removeItem(joinPlane, { deleteFromStorage: true });
      if (Object.keys(game.planeMap).length === 0) {
        // размещается первый plane на пустое поле
        game.addPlane(joinPlane);
        game.callEventHandlers({ handler: 'addPlane' });
      } else {
        // все port заблокированы, размещать plane некуда
        game.callEventHandlers({ handler: 'addPlane', data: { noAvailablePorts: true } });
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
