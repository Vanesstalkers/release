(game, { timerOverdue, forceActivePlayer } = {}) => {
  if (game.status === 'prepareStart') {
    const player = game.getActivePlayer();

    const plane = player.getObjectByCode('Deck[plane]').getObjects({ className: 'Plane' })[0];
    domain.game.getPlanePortsAvailability(game, { joinPlaneId: plane._id });
    const availablePort = game.availablePorts[0];
    domain.game.addPlane(game, { ...availablePort });

    return { status: 'ok' };
  }

  if (game.status !== 'inProcess') {
    console.log('game', { status: game.status, id: game._id });
    throw new Error('Действие запрещено.');
  }

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = game.getActivePlayer();
  const prevPlayerHand = prevPlayer.getObjectByCode('Deck[domino]');

  if (game.round > 0) {
    if (timerOverdue) {
      game.log({
        msg: `Игрок {{player}} не успел завершить все действия за отведенное время, и раунд №${game.round} завершился автоматически.`,
        userId: prevPlayer.userId,
      });
    } else {
      game.log({
        msg: `Игрок {{player}} закончил раунд №${game.round}.`,
        userId: prevPlayer.userId,
      });
    }
  }

  if (timerOverdue || game.activeEvent) {
    // таймер закончился или нажата кнопка окончания раунда при не завершенном активном событии

    if (game.activeEvent) {
      const source = game.getObjectById(game.activeEvent.sourceId);
      game.log(`Так как раунд был завершен, активное событие "${source.title}" сработало автоматически.`);
    }
    game.callEventHandlers({ handler: 'timerOverdue' });
  }

  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );

  // ЛОГИКА ОКОНЧАНИЯ ТЕКУЩЕГО РАУНДА

  game.callEventHandlers({ handler: 'endRound' });
  game.clearEventHandlers();

  // ЛОГИКА НАЧАЛА НОВОГО РАУНДА

  // player которому передают ход
  const activePlayer = game.changeActivePlayer({ player: forceActivePlayer });
  const playerHand = activePlayer.getObjectByCode('Deck[domino]');
  const gameDominoDeck = game.getObjectByCode('Deck[domino]');
  const cardDeckDrop = game.getObjectByCode('Deck[card_drop]');
  const cardDeckActive = game.getObjectByCode('Deck[card_active]');

  // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
  const deletedDices = game.getDeletedDices();
  let restoreAlreadyPlacedDice = false;
  for (const dice of deletedDices) {
    const zone = dice.getParent();

    // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
    // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
    const alreadyPlacedDice = zone.getNotDeletedItem();
    if (alreadyPlacedDice) {
      alreadyPlacedDice.moveToTarget(prevPlayerHand);
      restoreAlreadyPlacedDice = true;
    }

    // была размещена костяшка на прилегающую к Bridge зону
    if (dice.relatedPlacement) {
      for (const relatedDice of Object.values(dice.relatedPlacement)) {
        relatedDice.moveToTarget(prevPlayerHand);
      }
    }

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
  }
  if (deletedDices.length) {
    game.log({
      msg:
        `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена на свои места.` +
        (restoreAlreadyPlacedDice
          ? ` Те костяшки, которые уже были размещены взамен этой группы, были возвращены обратно в руку игрока {{player}}.`
          : ''),
      userId: prevPlayer.userId,
    });
  }

  if (prevPlayerHand.itemsCount() > game.settings.playerHandLimit) {
    if (!prevPlayer.eventData.disablePlayerHandLimit) {
      prevPlayerHand.moveAllItems({ target: gameDominoDeck });
      game.log({
        msg: `У игрока {{player}} превышено максимальное количество костяшек в руке на конец хода. Все его костяшки сброшены в колоду.`,
        userId: prevPlayer.userId,
      });
    }
  }
  prevPlayer.delete('eventData', 'disablePlayerHandLimit');

  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  for (const card of cardDeckActive.getObjects({ className: 'Card' })) {
    if (!card.isPlayOneTime()) card.set('played', null);
    card.moveToTarget(cardDeckDrop);
  }

  const newRoundNumber = game.round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`Начало раунда №${newRoundNumber}.`);

  const card = game.smartMoveRandomCard({ target: cardDeckActive });
  if (card && game.settings.acceptAutoPlayRoundStartCard === true) {
    card.play();
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  }

  // игра могла закончиться по результатам добавления новых plane на игровое поле
  if (game.status !== 'finished') {
    game.set('round', newRoundNumber);
    lib.store('lobby').get('main').updateGame({ _id: game._id, round: game.round });
    lib.timers.timerRestart(game, activePlayer.eventData.actionsDisabled === true ? { time: 5 } : {});
    for (const logEvent of newRoundLogEvents) game.log(logEvent);
  }

  return { status: 'ok' };
};
