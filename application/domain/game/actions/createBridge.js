(function ({ joinPort, targetPort }) {
  const joinPlane = joinPort.getParent();
  const targetPlane = targetPort.getParent();
  const bridgeToCardPlane = joinPlane.isCardPlane();
  // ! zoneLinks может быть несколько (links[...]) - пока что не актуально (нет таких Plane)
  const [joinPlaneZoneCode] = Object.values(joinPort.links);
  const [targetPlaneZoneCode] = Object.values(targetPort.links);
  const { DIRECTIONS } = joinPort.constructor;
  const targetPortDirect = DIRECTIONS[targetPort.getDirect()];
  const { reverse: reverseLinks, vertical: verticalZone } = targetPortDirect.bridge;

  const bridgeZoneLinks = {};
  const zs = [null, 'ZoneSide[1]', 'ZoneSide[2]'];
  if (bridgeToCardPlane) {
    const targetZoneCode = targetPlane.code + targetPlaneZoneCode; // получится корректный Plane[XXX]Zone[YYY]
    bridgeZoneLinks[reverseLinks ? zs[2] : zs[1]] = [targetZoneCode];
    // у card-plane отсутствует связанная zone
  } else {
    const targetZoneCode = targetPlane.code + targetPlaneZoneCode;
    const joinZoneCode = joinPlane.code + joinPlaneZoneCode;
    bridgeZoneLinks[reverseLinks ? zs[2] : zs[1]] = [targetZoneCode];
    bridgeZoneLinks[reverseLinks ? zs[1] : zs[2]] = [joinZoneCode];
  }

  const { targetLinkPoint } = this.run('updatePlaneCoordinates', { joinPort, targetPort });

  const bridgeData = {
    _code: joinPlane.code + '-' + targetPlane.code,
    left: targetLinkPoint.left,
    top: targetLinkPoint.top,
    rotation: targetPlane.rotation,
    zoneLinks: { 'Zone[1]': bridgeZoneLinks },
    zoneList: [
      {
        _code: 1,
        left: 0,
        top: 0,
        itemType: 'any',
        vertical: verticalZone,
      },
    ],
    bridgeToCardPlane,
  };

  const bridgeCode = this.run('addBridge', bridgeData);
  joinPort.set({ linkedBridge: bridgeCode });
  targetPort.set({ linkedBridge: bridgeCode });
});
