(game, { diceId }) => {
  const player = game.getActivePlayer();
  const playerHand = player.getObjectByCode('Deck[domino]');
  const dice = game.getObjectById(diceId);
  const zone = dice.getParent();

  const isAvailable = zone.checkIsAvailable(dice);
  if (!isAvailable && dice.relatedPlacement) {
    for (const relatedDice of Object.values(dice.relatedPlacement)) {
      relatedDice.moveToTarget(playerHand);
    }
  }

  dice.set({ deleted: null });
  zone.updateValues();

  const deletedDices = game.getDeletedDices();
  if (isAvailable) {
    const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
    // все удаленные dice заменены
    if (notReplacedDeletedDices.length === 0) {
      const deck = game.getObjectByCode('Deck[domino]');
      for (const dice of deletedDices) {
        dice.set({ deleted: null });
        dice.moveToTarget(deck); // возвращаем удаленные dice в deck
      }
    }
  } else {
    const alreadyPlacedDices = deletedDices.map((dice) => dice.getParent().getNotDeletedItem());
    for (const dice of alreadyPlacedDices) {
      dice.moveToTarget(playerHand);
    }
  }

  return { status: 'ok' };
};
