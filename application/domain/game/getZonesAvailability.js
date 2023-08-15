(game, { diceId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const player = game.getActivePlayer();
  const dice = game.getObjectById(diceId);
  const currentZone = dice.getParent();
  const availableZones = [];

  game.disableChanges();
  {
    const deletedDices = game.getDeletedDices();
    const deletedDicesZones = deletedDices.reduce((result, dice) => {
      const zone = dice.getParent();
      result = result.concat(zone);
      if (zone.findParent({ className: 'Bridge' })) result = result.concat(...zone.getNearZones());
      return result;
    }, []);

    // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
    for (const dice of deletedDices) dice.getParent().removeItem(dice);

    for (const { zone, status } of dice.findAvailableZones()) {
      if (zone != currentZone) {
        if (deletedDicesZones.length) {
          if (deletedDicesZones.includes(zone)) {
            if (status) availableZones.push(zone._id);
          }
        } else {
          if (status) availableZones.push(zone._id);
        }
      }
    }

    // восстанавливаем состояние для ранее удаленного dice
    for (const dice of deletedDices) dice.getParent().addItem(dice);
  }
  game.enableChanges();

  player.set({ availableZones });
  return { status: 'ok' };
};
