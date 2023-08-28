(function ({ joinPort }) {
  const availablePorts = [];

  const joinPlane = joinPort.getParent();
  for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
    if (plane === joinPlane) continue;

    for (const port of plane.getObjects({ className: 'Port' })) {
      if (port.linkedBridge) continue; // port уже занят

      for (const portDirect of Object.keys(port.direct)) {
        port.updateDirect(portDirect);
        this.run('updatePlaneCoordinates', { joinPort, targetPort: port });

        const planeHasCollysion = this.run('checkPlaneHasCollysion', { plane: joinPlane });
        if (planeHasCollysion) continue;

        availablePorts.push({
          position: joinPlane.getPosition(),
          joinPortId: joinPort._id,
          joinPortDirect: joinPort.getDirect(),
          targetPortId: port._id,
          targetPortDirect: portDirect,
        });
      }
    }
  }
  return availablePorts;
});
