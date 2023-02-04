({
  access: 'public',
  method: async ({ gameId }) => {
    const user = await db.mongo.findOne('user', context.userId);

    if (user.game.toString() !== gameId)
      return new Error(
        'Игрок не может совершить это действие, так как не участвует в игре.'
      );

    const Game = domain.game.class();
    const game = new Game({ _id: gameId }).fromJSON(
      await db.mongo.findOne('game', gameId)
    );
    // const game = domain.db.data.game[gameId];
    // const {proxy: game, storage} = lib.utils.addDeepProxyChangesWatcher( domain.db.data.game[gameId] );

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

    // !!! не забыть раскомментировать
    // if (user.player.toString() !== prevPlayer._id.toString())
    //   return new Error('Игрок не может совершить это действие, так как сейчас не его ход.');

    // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
    game.getDeletedDices().forEach((dice) => {
      const zone = dice.getParent();

      // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
      // (!!! если появятся новые источники размещения dice в zone, то этот код нужно переписать)
      const alreadyPlacedDice = zone.getNotDeletedItem();
      if (alreadyPlacedDice) alreadyPlacedDice.moveToTarget(prevPlayerHand);

      dice.deleted = undefined;
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
            linkedDice.sideList.reverse();
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

    game.round++;

    const $set = { ...game };
    delete $set._id;
    await db.mongo.updateOne(
      'game',
      { _id: db.mongo.ObjectID(gameId) },
      { $set }
    );

    // console.log({storage});
    // await db.mongo.updateOne('game', {_id: db.mongo.ObjectID(gameId)}, {$set: storage});

    // for (const [client] of domain.db.getRoom( 'game-'+gameId )) {
    //   client.emit('db/smartUpdated', {'game': {[game._id]: storage}});
    // }
    // console.log("storage", lib.utils.unflatten(storage));

    domain.db.broadcastData({
      game: { [gameId]: game },
    });

    return 'ok';
  },
});
