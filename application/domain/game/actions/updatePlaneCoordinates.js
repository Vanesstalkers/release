(function ({ joinPort, targetPort }) {
  const DIRECTIONS = joinPort.constructor.DIRECTIONS;

  const joinPlane = joinPort.getParent();
  joinPlane.set({
    rotation: getPlaneRotationByLinkedPortDirections({ joinPort, targetPort }),
  });

  const targetLinkPoint = getLinkPointCoordinates(targetPort);
  const joinLinkPoint = getLinkPointCoordinates(joinPort);

  // сдвигаем plane на значение разницы позиций между потенциальными точками стыковки
  joinPlane.set({
    top: joinPlane.top + targetLinkPoint.top - joinLinkPoint.top,
    left: joinPlane.left + targetLinkPoint.left - joinLinkPoint.left,
  });

  function getPlaneRotationByLinkedPortDirections({ joinPort, targetPort }) {
    let targetDirectWithRotate = targetPort.getDirect();
    let joinDirectWithRotate = joinPort.getDirect();
    const targetPlaneRotation = targetPort.getParent().getCurrentRotation();

    for (let i = 0; i < targetPlaneRotation; i++) {
      targetDirectWithRotate = DIRECTIONS[targetDirectWithRotate].nextDirection;
    }
    let resultRotation = 0;
    while (DIRECTIONS[joinDirectWithRotate].oppositeDirection !== targetDirectWithRotate) {
      joinDirectWithRotate = DIRECTIONS[joinDirectWithRotate].nextDirection;
      resultRotation++;
    }
    return resultRotation;
  }

  function getLinkPointCoordinates(port) {
    const plane = port.getParent();
    const coordinatesWithoutRotate = getLinkPointFromPortDirection(port);
    const rotatedCoordinates = rotatePoint(coordinatesWithoutRotate, plane.rotation);
    return lib.utils.sumPropertiesOfObjects(
      [rotatedCoordinates, { top: plane.top, left: plane.left }],
      ['top', 'left']
    );
  }

  function getLinkPointFromPortDirection(port) {
    const offsetSpace = 5;
    const direct = port.getDirect();
    switch (direct) {
      case 'left':
        return { top: port.top + port.height / 2, left: -offsetSpace };
      case 'right':
        return {
          top: port.top + port.height / 2,
          left: port.getParent().width + offsetSpace,
        };
      case 'top':
        return { top: -offsetSpace, left: port.left + port.width / 2 };
      case 'bottom':
        return {
          top: port.getParent().height + offsetSpace,
          left: port.left + port.width / 2,
        };
    }
  }

  function rotatePoint({ top, left }, rotate) {
    switch (rotate) {
      case 0:
        return { top, left };
      case 1:
        return { top: left, left: -top };
      case 2:
        return { top: -top, left: -left };
      case 3:
        return { top: -left, left: top };
    }
  }

  return { targetLinkPoint, joinLinkPoint };
});
