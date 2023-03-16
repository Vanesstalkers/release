async (game, { joinPortId, targetPortId, targetPortDirect, joinPortDirect }) => {
  const joinPort = game.getObjectById(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = game.getObjectById(targetPortId);

  game.set('availablePorts', null);

  // тут нужна проверка getAvailablePortsToJoinPlane

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);
  game.linkPlanes({ joinPort, targetPort });
  joinPlane.getParent().removeItem(joinPlane);
  joinPlane.getParent().deleteFromObjectStorage(joinPlane);
  game.addPlane(joinPlane);

  game.callEventHandlers({ handler: 'addPlane' });

  if (joinPlane.isStartPlane === true) {
    const gamePlaneDeck = game.getObjectByCode('Deck[plane]');
    const player = game.getActivePlayer();
    for (const plane of player.getObjectByCode('Deck[plane]').getObjects({ className: 'Plane' })) {
      if (plane.isStartPlane){
        plane.set('isStartPlane', null);
        plane.moveToTarget(gamePlaneDeck);
      }
    }
    if (Object.keys(game.planeMap).length < game.settings.planesNeedToStart) {
      game.changeActivePlayer();
    } else {
      game.set('activeEvent', null); // тут был prepareGame
      return await domain.game.endRound(game);
    }
  }

  return { status: 'ok' };
};
