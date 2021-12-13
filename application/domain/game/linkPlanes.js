async ({ joinPort, targetPort }) => {

  const ROTATIONS = joinPort.constructor.ROTATIONS;

  const joinPlane = joinPort.getParent();
  const targetPlane = targetPort.getParent();

  joinPlane.rotation = getPlaneRotationByLinkedPortDirections({ joinPort, targetPort });

  
  const targetLinkPoint = getLinkPointCoordinates(targetPort);
  // console.log("targetLinkPoint=", targetLinkPoint);
  const joinLinkPoint = getLinkPointCoordinates(joinPort);
  // console.log("joinLinkPoint=", joinLinkPoint);
  // console.log('sum=', {
    //     top: targetLinkPoint.top - joinLinkPoint.top,
    //     left: targetLinkPoint.left - joinLinkPoint.left,
    // });
  // // сдвигаем plane на значение разницы позиций между потенциальными точками стыковки
  joinPlane.top += targetLinkPoint.top - joinLinkPoint.top;
  joinPlane.left += targetLinkPoint.left - joinLinkPoint.left;

  console.log({ joinPort, targetPort, joinPlane, targetPlane })

  function getPlaneRotationByLinkedPortDirections({ joinPort, targetPort }) {

    let targetDirectWithRotate = targetPort.getDirect();
    let joinDirectWithRotate = joinPort.getDirect();
    const targetPlaneRotation = targetPort.getParent().getCurrentRotation();

    for (let i = 0; i < targetPlaneRotation; i++) {
      targetDirectWithRotate = ROTATIONS[targetDirectWithRotate].nextDirection;
    }
    let resultRotation = 0;
    while (ROTATIONS[joinDirectWithRotate].oppositeDirection !== targetDirectWithRotate) {
      joinDirectWithRotate = ROTATIONS[joinDirectWithRotate].nextDirection;
      resultRotation++;
    }
    return resultRotation;
  }

  function getLinkPointCoordinates(port) {
    const plane = port.getParent();
    //if (!plane) plane = port.plane;
    const coordinatesWithoutRotate = getLinkPointFromPortDirection(port);
    //console.log("coordinatesWithoutRotate=", coordinatesWithoutRotate);
    const rotatedCoordinates = rotatePoint(coordinatesWithoutRotate, plane.rotation);
    //console.log("rotatedCoordinates=", rotatedCoordinates);
    return lib.utils.sumPropertiesOfObjects([rotatedCoordinates, { top: plane.top, left: plane.left }], ['top', 'left']);
  }

  function getLinkPointFromPortDirection(port) {
    const offsetSpace = 5;
    const direct = port.getDirect();
    //console.log('getLinkPointFromPortDirection', port, direct);
    switch (direct) {
        case "left": return { top: port.top + port.height / 2, left: -offsetSpace };
        case "right": return { top: port.top + port.height / 2, left: port.getParent().width + offsetSpace };
        case "top": return { top: -offsetSpace, left: port.left + port.width / 2 };
        case "bottom": return { top: port.getParent().height + offsetSpace, left: port.left + port.width / 2 };
    }
  }

  function rotatePoint({ top, left }, rotate) {
    switch (rotate) {
        case 0: return { top, left };
        case 1: return { top: left, left: -top };
        case 2: return { top: -top, left: -left };
        case 3: return { top: -left, left: top };
    }
  }

  return { result: 'success' };
};  