(game, { joinPortId, targetPortId, targetPortDirect, joinPortDirect }) => {
  const joinPort = game.getObjectById(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = game.getObjectById(targetPortId);

  game.disableChanges();
  joinPort.updateDirect(joinPortDirect);
  const targetPortIsAvailable =
    game
      .getAvailablePortsToJoinPlane({ joinPort })
      .find(
        (item) =>
          item.targetPortId === targetPort._id &&
          item.joinPortDirect === joinPortDirect &&
          item.targetPortDirect === targetPortDirect
      ) !== undefined;
  game.enableChanges();

  if (!targetPortIsAvailable) throw new Error('Блок игрового поля не может быть добавлен к этой зоне интеграции');

  game.set({ availablePorts: [] });

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);
  game.linkPlanes({ joinPort, targetPort });
  joinPlane.getParent().removeItem(joinPlane, { deleteFromStorage: true });
  game.addPlane(joinPlane);

  game.callEventHandlers({ handler: 'addPlane' });
  return { status: 'ok' };
};
