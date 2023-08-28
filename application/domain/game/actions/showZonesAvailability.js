(function ({ diceId }) {
  if (this.activeEvent)
    throw new Error(
      this.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const player = this.getActivePlayer();
  const dice = this.getObjectById(diceId);
  const currentZone = dice.getParent();
  const availableZones = [];

  this.disableChanges();
  {
    const deletedDices = this.run('getDeletedDices');
    const deletedDicesZones = deletedDices.reduce((result, dice) => {
      const zone = dice.getParent();
      result.push(zone);
      if (zone.findParent({ className: 'Bridge' })) result.push(...zone.getNearZones());
      return result;
    }, []);

    // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
    for (const dice of deletedDices) dice.getParent().removeItem(dice);

    for (const { zone, status: zoneAvailable } of dice.findAvailableZones()) {
      if (zone === currentZone) continue;
      if (deletedDicesZones.length && !deletedDicesZones.includes(zone)) continue;
      if (!zoneAvailable) continue;
      availableZones.push(zone._id);
    }

    // восстанавливаем состояние для ранее удаленного dice
    for (const dice of deletedDices) dice.getParent().addItem(dice);
  }
  this.enableChanges();

  player.set({ availableZones });
});
