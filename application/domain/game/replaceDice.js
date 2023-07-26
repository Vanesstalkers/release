(game, { diceId, zoneId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  const player = game.getActivePlayer();
  const dice = game.getObjectById(diceId);
  const zone = game.getObjectById(zoneId);

  const diceIsInHand = dice.findParent({ directParent: player });
  if (!diceIsInHand) throw new Error('Костяшка должна находиться в руке.');

  if (dice.locked) throw new Error('Костяшка не может быть сыграна на этом ходу.');

  const deletedDices = game.getDeletedDices();
  const replacedDice = deletedDices.find((dice) => {
    const diceZone = dice.getParent();
    const plane = diceZone.getParent();
    const isBridgeZone = plane.matches({ className: 'Bridge' });
    const nearZones = diceZone.getNearZones();
    return diceZone == zone || (isBridgeZone && nearZones.includes(zone));
  });
  const remainDeletedDices = deletedDices.filter((dice) => dice != replacedDice);
  if (!replacedDice && remainDeletedDices.length)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных.');

  if (replacedDice && zone !== replacedDice.getParent()) {
    replacedDice.set({ relatedPlacement: { [dice._id]: dice } });
  }
  dice.moveToTarget(zone);
  dice.set({ placedAtRound: game.round });

  // у других игроков в хранилище нет данных об этом dice
  game.markNew(dice);
  game.markNew(dice.sideList[0]);
  game.markNew(dice.sideList[1]);

  if (zone.checkForRelease()) {
    const playerCardDeck = player.getObjectByCode('Deck[card]');
    game.smartMoveRandomCard({ target: playerCardDeck });
    lib.timers.timerRestart(game, { extraTime: game.settings.timerReleasePremium });

    let finalRelease = true;
    const planeList = game.getObjects({ className: 'Plane', directParent: game });
    const bridgeList = game.getObjects({ className: 'Bridge', directParent: game });
    for (const releaseItem of [...planeList, ...bridgeList]) {
      if (!finalRelease) continue;
      if (!releaseItem.release) finalRelease = false;
    }
    if (finalRelease) {
      game.setWinner({ player });
      game.updateStatus();
      return { status: 'ok', gameFinished: true };
    }

    game.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту события в руку.`);
  }

  const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
  // все удаленные dice заменены
  if (notReplacedDeletedDices.length === 0) {
    const deck = game.getObjectByCode('Deck[domino]');
    for (const dice of deletedDices) {
      dice.set({ deleted: null });
      dice.moveToTarget(deck); // возвращаем удаленные dice в deck
    }
  }

  game.callEventHandlers({ handler: 'replaceDice' });

  return { status: 'ok' };
};
