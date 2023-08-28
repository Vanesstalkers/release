(function ({ plane: checkPlane }) {
  const planePosition = checkPlane.getPosition();

  function noCrossing(pos1, pos2) {
    return (
      pos1.bottom < pos2.top || //
      pos1.top > pos2.bottom || //
      pos1.right < pos2.left || //
      pos1.left > pos2.right
    );
  }

  for (const plane of this.getObjects({ className: 'Plane', directParent: this })) {
    if (plane === checkPlane) continue;
    if (noCrossing(planePosition, plane.getPosition())) continue;

    return true;
  }

  return false;
});
