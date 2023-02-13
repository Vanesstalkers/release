async (game, { diceId }) => {
  const dice = game.getObjectById(diceId);
  const currentZone = dice.getParent();
  const availableZones = {};
  
  game.getZonesAvailability(dice).forEach((status, zone) => {
    if (zone != currentZone) {
      availableZones[zone._id] = { available: status };
    }
  });

  return { status: 'ok', clearChanges: true, availableZones };
};
