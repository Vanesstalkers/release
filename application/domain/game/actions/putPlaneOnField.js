(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }, { addPlaneConfig } = {}) {
  const joinPort = this.getObjectById(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = this.getObjectById(targetPortId);

  let targetPortIsAvailable = false;
  this.disableChanges();
  {
    let availablePorts = this.availablePorts; // возможно ранее уже был вызван showPlanePortsAvailability
    if (!availablePorts?.length) {
      // вызов с клиента
      joinPort.updateDirect(joinPortDirect);
      availablePorts = this.run('getAvailablePortsToJoinPort', { joinPort });
    }

    targetPortIsAvailable =
      availablePorts.find(
        (item) =>
          item.joinPortId === joinPortId &&
          item.targetPortId === targetPortId &&
          item.joinPortDirect === joinPortDirect &&
          item.targetPortDirect === targetPortDirect
      ) !== undefined
        ? true
        : false;
  }
  this.enableChanges();
  if (!targetPortIsAvailable) throw new Error('Блок игрового поля не может быть добавлен к этой зоне интеграции');

  this.set({ availablePorts: [] });

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);
  this.run('createBridge', { joinPort, targetPort });

  // сделать через plane.moveToTarget нельзя, так как у game (в this) нет метода addItem
  const planeCurrentParent = joinPlane.getParent();
  planeCurrentParent.removeItem(joinPlane);
  this.addPlane(joinPlane, addPlaneConfig);
});
