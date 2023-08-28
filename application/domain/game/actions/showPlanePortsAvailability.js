(function ({ joinPlaneId }) {
  const availablePorts = [];
  const joinPlane = this.getObjectById(joinPlaneId);

  this.disableChanges();
  {
    for (const joinPort of joinPlane.getObjects({ className: 'Port' })) {
      const realDirect = joinPort.getDirect();
      for (const portDirect of Object.keys(joinPort.direct)) {
        joinPort.updateDirect(portDirect);
        const ports = this.run('getAvailablePortsToJoinPort', { joinPort });
        availablePorts.push(...ports);
      }
      joinPort.updateDirect(realDirect);
    }
  }
  this.enableChanges();

  // заменить на clientCustomUpdates не получится, в частности, из-за сложной логики с card-plane (например, при авторозыгрыше "req_*"-карты в начале игры)
  this.set({ availablePorts });

  if (availablePorts.length === 0) this.emit('noAvailablePorts', { joinPlane }, { softCall: true });
});
