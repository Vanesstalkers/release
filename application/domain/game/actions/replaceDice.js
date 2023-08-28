(function ({ diceId, zoneId }) {
  if (this.activeEvent)
    throw new Error(
      this.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const player = this.getActivePlayer();

  if (!player.availableZones.includes(zoneId)) throw new Error('Данная зона запрещена для размещения');

  const dice = this.getObjectById(diceId);
  const zone = this.getObjectById(zoneId);

  const diceIsInHand = dice.findParent({ directParent: player });
  if (!diceIsInHand) throw new Error('Костяшка должна находиться в руке.');

  if (dice.locked) throw new Error('Костяшка не может быть сыграна на этом ходу.');

  const deletedDices = this.run('getDeletedDices');
  const replacedOrRelatedDice = deletedDices.find((dice) => {
    const diceZone = dice.getParent();
    const plane = diceZone.getParent();
    const isBridgeZone = plane.matches({ className: 'Bridge' });
    const nearZones = diceZone.getNearZones();
    return diceZone == zone || (isBridgeZone && nearZones.includes(zone));
  });
  const remainDeletedDices = deletedDices.filter((dice) => dice != replacedOrRelatedDice);
  if (!replacedOrRelatedDice && remainDeletedDices.length)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных.');

  if (replacedOrRelatedDice && zone !== replacedOrRelatedDice.getParent()) {
    replacedOrRelatedDice.set({ relatedPlacement: { [dice.id()]: true } });
  }
  dice.moveToTarget(zone);
  dice.set({ placedAtRound: this.round });

  // у других игроков в хранилище нет данных об этом dice
  this.markNew(dice);
  this.markNew(dice.sideList[0]);
  this.markNew(dice.sideList[1]);

  const releaseInitiated = zone.checkForRelease();
  if (releaseInitiated) {
    const playerCardDeck = player.getObjectByCode('Deck[card]');
    this.run('smartMoveRandomCard', { target: playerCardDeck });
    lib.timers.timerRestart(this, { extraTime: this.settings.timerReleasePremium });
    this.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту события в руку.`);
  }

  const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
  // все удаленные dice заменены
  if (notReplacedDeletedDices.length === 0) {
    const deck = this.getObjectByCode('Deck[domino]');
    for (const dice of deletedDices) {
      dice.set({ deleted: null });
      dice.moveToTarget(deck); // возвращаем удаленные dice в deck
    }
  }

  this.emitCardEvents('replaceDice');
});
