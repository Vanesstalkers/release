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

  await game.callEventHandlers({ handler: 'addPlane' });
  return { status: 'ok' };
};
