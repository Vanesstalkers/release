async (
  game,
  { joinPortId, targetPortId, targetPortDirect, joinPortDirect }
) => {
  const joinPort = game.getObjectById(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = game.getObjectById(targetPortId);

  // тут нужна проверка getAvailablePortsToJoinPlane

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);
  game.linkPlanes({ joinPort, targetPort });

  joinPlane.getParent().removeItem(joinPlane);
  joinPlane.getParent().deleteFromObjectStorage(joinPlane);
  game.addPlane(joinPlane);

  return { status: 'ok' };
};
