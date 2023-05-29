async (game, { joinPortId, targetPortId, targetPortDirect, joinPortDirect }) => {
  const joinPort = game.getObjectById(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = game.getObjectById(targetPortId);

  game.set('availablePorts', []);

  game.disableChanges();
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

  if (targetPortIsAvailable) {
    joinPort.updateDirect(joinPortDirect);
    targetPort.updateDirect(targetPortDirect);
    game.linkPlanes({ joinPort, targetPort });
    joinPlane.getParent().removeItem(joinPlane, { deleteFromStorage: true });
    game.addPlane(joinPlane);

    await game.callEventHandlers({ handler: 'addPlane' });
    return { status: 'ok' };
  } else {
    return { status: 'err', message: 'Блок игрового поля не может быть добавлен к этой зоне интеграции' };
  }
};
