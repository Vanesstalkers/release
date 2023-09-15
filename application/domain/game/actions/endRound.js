(function ({ timerOverdue, forceActivePlayer } = {}) {
  if (this.status !== 'IN_PROCESS') {
    console.log('game', { status: this.status, id: this.id() });
    throw new Error('Действие запрещено.');
  }

  const {
    round,
    activeEvent, // нельзя тут объявлять, потому что он динамически обновиться в emitCardEvents
    settings: {
      // конфиги
      autoFinishAfterRoundsOverdue,
      playerHandLimit,
      roundStartCardAddToPlayerHand,
      allowedAutoCardPlayRoundStart,
    },
  } = this;

  const timerOverdueCounter = timerOverdue ? (this.timerOverdueCounter || 0) + 1 : 0;
  // если много ходов было завершено по таймауту, то скорее всего все игроки вышли и ее нужно завершать
  if (timerOverdueCounter > autoFinishAfterRoundsOverdue) {
    this.endGame();
  }

  // player чей ход только что закончился (получаем принципиально до вызова changeActivePlayer)
  const prevPlayer = this.getActivePlayer();
  const prevPlayerHand = prevPlayer.getObjectByCode('Deck[domino]');

  if (round > 0) {
    if (timerOverdue) {
      this.logs({
        msg: `Игрок {{player}} не успел завершить все действия за отведенное время, и раунд №${round} завершился автоматически.`,
        userId: prevPlayer.userId,
      });
    } else {
      this.logs(
        {
          msg: `Игрок {{player}} закончил раунд №${round}.`,
          userId: prevPlayer.userId,
        },
        { consoleMsg: true }
      );
    }
  }

  if (timerOverdue || this.activeEvent) {
    // таймер закончился или нажата кнопка окончания раунда при не завершенном активном событии

    if (this.activeEvent) {
      const source = this.getObjectById(this.activeEvent.sourceId);
      this.logs(`Так как раунд был завершен, активное событие "${source.title}" сработало автоматически.`);
    }
    this.emitCardEvents('timerOverdue');
  }

  // ЛОГИКА ОКОНЧАНИЯ ТЕКУЩЕГО РАУНДА

  this.emitCardEvents('endRound');
  this.clearCardEvents();

  // ЛОГИКА НАЧАЛА НОВОГО РАУНДА

  // player которому передают ход
  const activePlayer = this.changeActivePlayer({ player: forceActivePlayer });
  const playerHand = activePlayer.getObjectByCode('Deck[domino]');
  const playerCardHand = activePlayer.getObjectByCode('Deck[card]');
  const gameDominoDeck = this.getObjectByCode('Deck[domino]');
  const cardDeckDrop = this.getObjectByCode('Deck[card_drop]');
  const cardDeckActive = this.getObjectByCode('Deck[card_active]');

  // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
  const deletedDices = this.run('getDeletedDices');
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

    // была размещена костяшка на прилегающую к Bridge зоне
    if (dice.relatedPlacement) {
      for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
        const relatedDice = this.getObjectById(relatedDiceId);
        relatedDice.moveToTarget(prevPlayerHand);
      }
    }

    dice.set({ deleted: null });
    zone.updateValues();
    for (const side of zone.sideList) {
      for (const linkCode of Object.values(side.links)) {
        const linkedSide = this.getObjectByCode(linkCode);
        const linkedZone = linkedSide.getParent();
        const linkedDice = linkedZone.getNotDeletedItem();

        const checkIsAvailable = !linkedDice || linkedZone.checkIsAvailable(linkedDice, { skipPlacedItem: true });
        if (checkIsAvailable === 'rotate') {
          // linkedDice был повернут после удаления dice
          linkedDice.set({ sideList: [...linkedDice.sideList.reverse()] });
          linkedZone.updateValues();
        }
      }
    }
  }
  if (deletedDices.length) {
    this.logs({
      msg:
        `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена на свои места.` +
        (restoreAlreadyPlacedDice
          ? ` Те костяшки, которые уже были размещены взамен этой группы, были возвращены обратно в руку игрока {{player}}.`
          : ''),
      userId: prevPlayer.userId,
    });
  }

  if (prevPlayerHand.itemsCount() > playerHandLimit) {
    // слишком много доминошек в руке
    if (!prevPlayer.eventData.disablePlayerHandLimit) {
      prevPlayerHand.moveAllItems({ target: gameDominoDeck });
      this.logs({
        msg: `У игрока {{player}} превышено максимальное количество костяшек в руке на конец хода. Все его костяшки сброшены в колоду.`,
        userId: prevPlayer.userId,
      });
    }
  }
  prevPlayer.set({ eventData: { disablePlayerHandLimit: null } });

  gameDominoDeck.moveRandomItems({ count: 1, target: playerHand });

  for (const card of cardDeckActive.getObjects({ className: 'Card' })) {
    if (!card.isPlayOneTime()) card.set({ played: null });
    card.moveToTarget(cardDeckDrop);
  }

  this.checkCrutches();

  const newRoundNumber = round + 1;
  const newRoundLogEvents = [];
  newRoundLogEvents.push(`Начало раунда №${newRoundNumber}.`);

  const card = this.run('smartMoveRandomCard', {
    target: roundStartCardAddToPlayerHand ? playerCardHand : cardDeckActive,
  });
  if (card && allowedAutoCardPlayRoundStart === true) {
    card.play();
    newRoundLogEvents.push(`Активировано ежедневное событие "${card.title}".`);
  }

  // обновляем таймер
  const actionsDisabled = activePlayer.eventData.actionsDisabled === true;
  const timerConfig = actionsDisabled ? { time: 5 } : {};
  lib.timers.timerRestart(this, timerConfig);

  // обновляем логи
  for (const logEvent of newRoundLogEvents) this.logs(logEvent);

  this.set({ round: newRoundNumber, timerOverdueCounter });
});
