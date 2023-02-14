async (game, { diceId, zoneId }) => {
  const dice = game.getObjectById(diceId);
  const zone = game.getObjectById(zoneId);

  const deletedDices = game.getDeletedDices();
  const replacedDice = deletedDices.find((dice) => dice.getParent() == zone);
  const remainDeletedDices = deletedDices.filter((dice) => dice != replacedDice);
  if (!replacedDice && remainDeletedDices.length)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных');

  dice.moveToTarget(zone);
  if (zone.checkForRelease()) {
    const player = game.getActivePlayer();
    const playerHand = player.getObjectByCode('Deck[card]');
    const deck = game.getObjectByCode('Deck[card]');
    const item = deck.getRandomItem();
    if (item) item.moveToTarget(playerHand);
  }

  const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
  // все удаленные dice заменены
  if (notReplacedDeletedDices.length === 0) {
    const deck = game.getObjectByCode('Deck[domino]');
    deletedDices.forEach((dice) => {
      dice.set('deleted', false);
      dice.moveToTarget(deck); // возвращаем удаленные dice в deck
    });
  }

  game.callEventHandlers({ handler: 'replaceDice' });

  return { status: 'ok' };
};
