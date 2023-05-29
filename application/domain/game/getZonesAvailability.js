(game, { diceId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const dice = game.getObjectById(diceId);
  const currentZone = dice.getParent();
  const availableZones = {};

  game.disableChanges();
  {
    const deletedDices = game.getDeletedDices();
    const deletedDicesZones = deletedDices.reduce((result, dice) => {
      const zone = dice.getParent();
      result = result.concat(zone);
      if (zone.findParent({ className: 'Bridge' })) result = result.concat(...zone.getNearZones());
      return result;
    }, []);
    game.getZonesAvailability(dice).forEach((status, zone) => {
      if (zone != currentZone) {
        if (deletedDicesZones.length) {
          if (deletedDicesZones.includes(zone)) {
            availableZones[zone._id] = { available: status };
          }
        } else {
          availableZones[zone._id] = { available: status };
        }
      }
    });
  }
  game.enableChanges();

  return { status: 'ok', clientCustomUpdates: { zone: availableZones } };
};
