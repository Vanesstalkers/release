(function ({ diceId }) {
  const player = this.getActivePlayer();
  const playerHand = player.getObjectByCode('Deck[domino]');
  const dice = this.getObjectById(diceId);
  const zone = dice.getParent();

  const isAvailable = zone.checkIsAvailable(dice);
  if (!isAvailable && dice.relatedPlacement) {
    for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
      const relatedDice = this.getObjectById(relatedDiceId);
      relatedDice.moveToTarget(playerHand);
    }
  }

  dice.set({ deleted: null });
  zone.updateValues();

  const deletedDices = this.run('getDeletedDices');
  if (isAvailable) {
    const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
    // все удаленные dice заменены
    if (notReplacedDeletedDices.length === 0) {
      const deck = this.getObjectByCode('Deck[domino]');
      for (const dice of deletedDices) {
        dice.set({ deleted: null });
        dice.moveToTarget(deck); // возвращаем удаленные dice в deck
      }
    }
  } else {
    const alreadyPlacedDices = deletedDices.map((dice) => dice.getParent().getNotDeletedItem()).filter((dice) => dice);
    for (const dice of alreadyPlacedDices) {
      dice.moveToTarget(playerHand);
    }
  }
});
