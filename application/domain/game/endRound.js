async (game, { timerOverdue, forceActivePlayer } = {}) => {
  if (game.status === 'prepareStart') {
    const player = game.getActivePlayer();

    const plane = player.getObjectByCode('Deck[plane]').getObjects({ className: 'Plane' })[0];
    await domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
    const availablePort = game.availablePorts[0];
    await domain.game.addPlane(game, { ...availablePort });

    return { status: 'ok' };
  }

  if (game.status !== 'inProcess') throw new Error('Действие запрещено');

  if (timerOverdue || game.activeEvent) await game.callEventHandlers({ handler: 'timerOverdue' });

  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  // ЛОГИКА ОКОНЧАНИЯ ТЕКУЩЕГО РАУНДА

  await game.callEventHandlers({ handler: 'endRound' });
  game.clearEventHandlers();

  // ЛОГИКА НАЧАЛА НОВОГО РАУНДА

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = game.getActivePlayer();
  const prevPlayerHand = prevPlayer.getObjectByCode('Deck[domino]');

  prevPlayer.delete('eventData', 'actionsDisabled');
  const singlePlayerSkipTurn = game.isSinglePlayer() && prevPlayer.eventData.skipTurn;
  if (singlePlayerSkipTurn) {
    prevPlayer.delete('eventData', 'skipTurn');
    prevPlayer.assign('eventData', { actionsDisabled: true });
  }

  // player которому передают ход
  const activePlayer = game.changeActivePlayer({ player: forceActivePlayer });
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
    if (!prevPlayer.eventData.disablePlayerHandLimit) {
      prevPlayerHand.moveAllItems({ target: gameDominoDeck });
    }
  }
  prevPlayer.delete('eventData', 'disablePlayerHandLimit');

  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  for (const card of cardDeckActive.getObjects({ className: 'Card' })) {
    if (!card.isPlayOneTime()) card.set('played', null);
    card.moveToTarget(cardDeckDrop);
  }

  const card = await game.smartMoveRandomCard({ target: cardDeckActive });
  if (card && game.settings.acceptAutoPlayRoundStartCard === true) await card.play();
  
  // игра могла закончиться по результатам добавления новых plane на игровое поле
  if (game.status !== 'finished') { 
    game.set('round', game.round + 1);
    lib.timers.timerRestart(game, singlePlayerSkipTurn ? { time: 5 } : {});
  }

  return { status: 'ok' };
};
