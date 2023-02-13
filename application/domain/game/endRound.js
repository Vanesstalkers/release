async (game) => {
  if (game.activeEvent)
    return new Error(
      game.activeEvent.errorMsg ||
        'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  // ЛОГИКА ОКОНЧАНИЯ ТЕКУЩЕГО РАУНДА

  game.callEventHandlers({ handler: 'endRound' });
  game.clearEventHandlers();

  // ЛОГИКА НАЧАЛА НОВОГО РАУНДА

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = game.getActivePlayer();
  const prevPlayerHand = prevPlayer.getObjectByCode('Deck[domino]');
  // player которому передают ход
  const activePlayer = game.changeActivePlayer();
  const playerHand = activePlayer.getObjectByCode('Deck[domino]');

  // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
  game.getDeletedDices().forEach((dice) => {
    const zone = dice.getParent();

    // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
    // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
    const alreadyPlacedDice = zone.getNotDeletedItem();
    if (alreadyPlacedDice) alreadyPlacedDice.moveToTarget(prevPlayerHand);

    dice.set('deleted', false);
    zone.updateValues();
    for (const side of zone.sideList) {
      for (const linkCode of Object.values(side.links)) {
        const linkedSide = game.getObjectByCode(linkCode);
        const linkedZone = linkedSide.getParent();
        const linkedDice = linkedZone.getNotDeletedItem();

        const checkIsAvailable =
          !linkedDice ||
          linkedZone.checkIsAvailable(linkedDice, { skipPlacedItem: true });
        if (checkIsAvailable === 'rotate') {
          // linkedDice был повернут после удаления dice
          linkedDice.set('sideList', [...linkedDice.sideList.reverse()]);
          linkedZone.updateValues();
        }
      }
    }
  });

  const deck = game.getObjectByCode('Deck[domino]');
  const item = deck.getRandomItem();
  if (item) item.moveToTarget(playerHand);

  const cardDeck = game.getObjectByCode('Deck[card]');
  const cardDeckDrop = game.getObjectByCode('Deck[card_drop]');
  const cardDeckActive = game.getObjectByCode('Deck[card_active]');
  let card = cardDeck.getRandomItem();
  cardDeckActive.getObjects({ className: 'Card' }).forEach((card) => {
    card.moveToTarget(cardDeckDrop);
  });
  if (!card) {
    cardDeckDrop.getObjects({ className: 'Card' }).forEach((card) => {
      card.moveToTarget(cardDeck);
    });
    card = cardDeck.getRandomItem();
  }
  if (card) {
    card.moveToTarget(cardDeckActive);
    if (card.needAutoPlay()) card.play();
  }

  game.set('round', game.round + 1);

  return { status: 'ok' };
};
