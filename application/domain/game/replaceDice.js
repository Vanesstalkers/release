async (game, { diceId, zoneId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const dice = game.getObjectById(diceId);
  const zone = game.getObjectById(zoneId);

  if (dice.locked) throw new Error('Костяшка не может быть сыграна на этом ходу');

  const deletedDices = game.getDeletedDices();
  const replacedDice = deletedDices.find((dice) => dice.getParent() == zone);
  const remainDeletedDices = deletedDices.filter((dice) => dice != replacedDice);
  if (!replacedDice && remainDeletedDices.length)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных');

  dice.moveToTarget(zone);
  game.markNew(dice); // у других игроков в хранилище нет данных об этом dice
  if (zone.checkForRelease()) {
    game.smartMoveRandomCard({ target: game.getActivePlayer().getObjectByCode('Deck[card]') });
  }

  const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
  // все удаленные dice заменены
  if (notReplacedDeletedDices.length === 0) {
    const deck = game.getObjectByCode('Deck[domino]');
    deletedDices.forEach((dice) => {
      dice.set('deleted', null);
      dice.moveToTarget(deck); // возвращаем удаленные dice в deck
    });
  }

  await game.callEventHandlers({ handler: 'replaceDice' });

  return { status: 'ok' };
};
