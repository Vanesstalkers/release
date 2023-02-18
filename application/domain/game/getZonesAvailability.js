async (game, { diceId }) => {
  const dice = game.getObjectById(diceId);
  const currentZone = dice.getParent();
  const availableZones = {};

  game.disableChanges();
  {
    game.getZonesAvailability(dice).forEach((status, zone) => {
      if (zone != currentZone) {
        availableZones[zone._id] = { available: status };
      }
    });
  }
  game.enableChanges();

  return { status: 'ok', clientCustomUpdates: { zone: availableZones } };
};
