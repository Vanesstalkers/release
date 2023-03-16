async (game) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  // ЛОГИКА ОКОНЧАНИЯ ТЕКУЩЕГО РАУНДА

  game.callEventHandlers({ handler: 'endRound' });
  game.clearEventHandlers();

  // ЛОГИКА НАЧАЛА НОВОГО РАУНДА

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = game.getActivePlayer();
  const prevPlayerHand = prevPlayer.getObjectByCode('Deck[domino]');

  if (prevPlayer.getObjectByCode('Deck[plane]').getObjects({ className: 'Plane' }).length > 0)
    throw new Error('Игрок должен разместить блоки поля из его руки.');

  // player которому передают ход
  const activePlayer = game.changeActivePlayer();
  const playerHand = activePlayer.getObjectByCode('Deck[domino]');
  const gameDominoDeck = game.getObjectByCode('Deck[domino]');
  const cardDeckDrop = game.getObjectByCode('Deck[card_drop]');
  const cardDeckActive = game.getObjectByCode('Deck[card_active]');

  // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
  game.getDeletedDices().forEach((dice) => {
    const zone = dice.getParent();

    // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
    // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
    const alreadyPlacedDice = zone.getNotDeletedItem();
    if (alreadyPlacedDice) alreadyPlacedDice.moveToTarget(prevPlayerHand);

    dice.set('deleted', null);
    zone.updateValues();
    for (const side of zone.sideList) {
      for (const linkCode of Object.values(side.links)) {
        const linkedSide = game.getObjectByCode(linkCode);
        const linkedZone = linkedSide.getParent();
        const linkedDice = linkedZone.getNotDeletedItem();

        const checkIsAvailable = !linkedDice || linkedZone.checkIsAvailable(linkedDice, { skipPlacedItem: true });
        if (checkIsAvailable === 'rotate') {
          // linkedDice был повернут после удаления dice
          linkedDice.set('sideList', [...linkedDice.sideList.reverse()]);
          linkedZone.updateValues();
        }
      }
    }
  });

  if (prevPlayerHand.itemsCount() > game.settings.playerHandLimit) {
    if (prevPlayer.eventData.disablePlayerHandLimit) {
      prevPlayer.delete('eventData', 'disablePlayerHandLimit');
    } else {
      prevPlayerHand.moveAllItems({ target: gameDominoDeck });
    }
  }

  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  for (const card of cardDeckActive.getObjects({ className: 'Card' })) {
    card.moveToTarget(cardDeckDrop);
  }

  const card = game.smartMoveRandomCard({ target: cardDeckActive });
  if (card && game.settings.acceptAutoPlayRoundStartCard === true && card.needAutoPlay()) card.play();

  game.set('round', game.round + 1);

  return { status: 'ok' };
};
