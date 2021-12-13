({
    linkPlanesByPorts({joinPort, targetPort}) {

        const joinPlane = joinPort.plane;
        const targetPlane = targetPort.plane;

        joinPlane.rotate = this.getPlaneRotationByLinkedPortDirections(joinPort, targetPort, targetPlane.rotate);

        const targetLinkPoint = this.getLinkPointCoordinates(targetPort, targetPlane);
        console.log("targetLinkPoint=", targetLinkPoint);
        const joinLinkPoint = this.getLinkPointCoordinates(joinPort, joinPlane);
        console.log("joinLinkPoint=", joinLinkPoint);
        console.log('sum=', {
            top: targetLinkPoint.top - joinLinkPoint.top,
            left: targetLinkPoint.left - joinLinkPoint.left,
        });
        // сдвигаем plane на значение разницы позиций между потенциальными точками стыковки
        joinPlane.top += targetLinkPoint.top - joinLinkPoint.top;
        joinPlane.left += targetLinkPoint.left - joinLinkPoint.left;
    },

    getLinkPointCoordinates(port, plane) {
        if (!plane) plane = port.plane;
        const coordinatesWithoutRotate = this.getLinkPointFromPortDirection(port);
        console.log("coordinatesWithoutRotate=", coordinatesWithoutRotate);
        const rotatedCoordinates = this.rotatePoint(coordinatesWithoutRotate, plane.rotate);
        console.log("rotatedCoordinates=", rotatedCoordinates);
        return lib.utils.sumPropertiesOfObjects([rotatedCoordinates, { top: plane.top, left: plane.left }], ['top', 'left']);
    },
    rotatePoint({ top, left }, rotate) {
        switch (rotate) {
            case 0: return { top, left };
            case 1: return { top: left, left: -top };
            case 2: return { top: -top, left: -left };
            case 3: return { top: -left, left: top };
        }
    },

    getLinkPointFromPortDirection(port, direct, offsetSpace = 5) {
        if (!direct) direct = port.direct;
        console.log('getLinkPointFromPortDirection', port, direct);
        switch (direct) {
            case "left": return { top: port.top + port.height / 2, left: -offsetSpace };
            case "right": return { top: port.top + port.height / 2, left: port.plane.width + offsetSpace };
            case "top": return { top: -offsetSpace, left: port.left + port.width / 2 };
            case "bottom": return { top: port.plane.height + offsetSpace, left: port.left + port.width / 2 };
        }
    },

    ROTATIONS: {
        top: { oppositeDirection: "bottom", nextDirection: "right" },
        right: { oppositeDirection: "left", nextDirection: "bottom" },
        bottom: { oppositeDirection: "top", nextDirection: "left" },
        left: { oppositeDirection: "right", nextDirection: "top" },
    },
    getPlaneRotationByLinkedPortDirections(joinPort, targetPort, targetPlaneRotation) {
        let targetDirectWithRotate = targetPort.direct;
        let joinDirectWithRotate = joinPort.direct;
        for (let i = 0; i < targetPlaneRotation; i++) {
            targetDirectWithRotate = this.ROTATIONS[targetDirectWithRotate].nextDirection;
        }
        let resultRotation = 0;
        while (this.ROTATIONS[joinDirectWithRotate].oppositeDirection !== targetDirectWithRotate) {
            joinDirectWithRotate = this.ROTATIONS[joinDirectWithRotate].nextDirection;
            resultRotation++;
        }
        return resultRotation;
    },
});
