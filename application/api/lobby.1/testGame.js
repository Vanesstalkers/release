({
  access: 'public',
  method: async ({ insertIntoDB }) => {
    async function newGame() {
      const Game = domain.game.class();
      let game = new Game().fromJSON(domain.game.exampleJSON_test);
      game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      // function consoleKeys(obj) {
      //   console.log(Object.keys(obj));
      // }

      console.log(JSON.stringify(game, '', 2));
      //console.log(JSON.stringify(game.getObjectByCode('Plane[1]'), '', 2));

      const Plane2 = game.getObjectByCode('Plane[2]');
      if(Plane2){
        game.linkPlanes({
          joinPort: Plane2.getObjectByCode('Port[1]'),
          targetPort: game.getObjectByCode('Plane[1]').getObjectByCode('Port[1]'),
        });
        game.linkPlanes({
          joinPort: game.getObjectByCode('Plane[3]').getObjectByCode('Port[2]'),
          targetPort: Plane2.getObjectByCode('Port[4]'),
        });
      }

      game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      const deck = game.getObjectByCode('Deck[domino]');
      const playerHand = game
        .getObjectByCode('Player[1]')
        .getObjectByCode('Deck[domino]');
      const dice = deck.getObjectByCode('Dice[55]');
      dice.moveToTarget(playerHand);
      deck.getRandomItem().moveToTarget(playerHand);

      const movableItem = playerHand.getObjectById(dice._id);
      const zone = game.getObjectByCode('Plane[1]').getObjectByCode('Zone[1]');
      movableItem.moveToTarget(zone);

      // deck
      //   .getObjectByCode('Dice[45]')
      //   .moveToTarget(game.getObjectByCode('Plane[1]Zone[4]'));

      game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      const checkIsAvailableDice = deck.getObjectByCode('Dice[45]');

      // game.getObjects({className: 'Zone'}).forEach(obj => {
      //   const a = obj.checkIsAvailable(checkIsAvailableDice);
      //   if( a ){
      //     console.log('checkIsAvailable=', a, obj.code);
      //   }
      // });
      console.log('getAvailableZones', game.getZonesAvailability(checkIsAvailableDice));

      game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));
      if (insertIntoDB) {
        const insertOne = await db.mongo.insertOne('game', game);
        game._id = insertOne._id;
      }

      return { result: 'success', gameId: game._id };
    }

    const { gameId } = await newGame();

    if (insertIntoDB) {
      const game = await db.mongo.findOne('game', gameId);

      domain.db.data.game[game._id] = game;
      domain.db.forms.lobby.__game[game._id] = {};
      domain.db.broadcast({
        room: 'lobby',
        data: { lobby: domain.db.forms.lobby },
        event: ({ client }) => {
          domain.db.subscribe({
            name: 'game-' + game._id,
            client,
            type: 'lobby',
          });
          client.emit('db/updated', { game: { [game._id]: game } });
        },
      });
    }

    return { result: 'success', gameId };
  },
});
