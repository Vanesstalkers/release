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

      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[1]').getObjectByCode('Port[1]'),
        targetPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[2]'),
      });
      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[3]').getObjectByCode('Port[2]'),
        targetPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[4]'),
      });

      // game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      // const deck = game.getObjectByCode('Deck[domino]');
      // const playerDicesHand = game.getObjectByCode('Player[1]').getObjectByCode('Deck[domino]');
      // const dice = deck.getObjectByCode('Dice[55]');
      // dice.moveToTarget(playerDicesHand);
      // deck.getRandomItem().moveToTarget(playerDicesHand);

      // const movableItem = playerDicesHand.getObjectById(dice._id);
      // const zone = game.getObjectByCode('Plane[1]').getObjectByCode('Zone[2]');
      // movableItem.moveToTarget(zone);

      const playerPlanesHand = game.getObjectByCode('Player[1]').getObjectByCode('Deck[plane]');
      playerPlanesHand.addItem({
        _code: 1,
        zoneLinks: {
          'Zone[1]': {
            'ZoneSide[1]': ['Zone[2].ZoneSide[1]'],
            'ZoneSide[2]': ['Zone[4].ZoneSide[1]'],
          },
          'Zone[3]': {
            'ZoneSide[1]': ['Zone[2].ZoneSide[2]'],
            'ZoneSide[2]': ['Zone[4].ZoneSide[2]'],
          },
        },
        zoneList: [
          { _code: 1, left: 130, top: 7, itemType: 'any', s: 'bash' },
          {
            _code: 2,
            left: 130,
            top: 100,
            vertical: 1,
            itemType: 'any',
            s: 'db',
          },
          { _code: 3, left: 230, top: 170, itemType: 'any', s: 'db' },
          {
            _code: 4,
            left: 300,
            top: 7,
            vertical: 1,
            itemType: 'any',
            s: 'core',
          },
        ],
        portList: [
          {
            _code: 1,
            left: 30,
            top: 100,
            direct: { left: true },
            links: ['Zone[2].ZoneSide[1]'],
            t: 'any',
            s: 'core',
          },
          {
            _code: 2,
            left: 400,
            top: 76,
            direct: { right: true },
            links: ['Zone[4].ZoneSide[2]'],
            t: 'any',
            s: 'core',
          },
        ],
      });
      playerPlanesHand.addItem({
        _code: 2,
        zoneLinks: {
          'Zone[1]': {
            'ZoneSide[1]': [],
            'ZoneSide[2]': ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
          },
          'Zone[3]': {
            'ZoneSide[1]': ['Zone[2].ZoneSide[1]', 'Zone[2].ZoneSide[2]'],
            'ZoneSide[2]': [],
          },
        },
        zoneList: [
          { _code: 1, left: 50, top: 87, itemType: 'any' },
          {
            _code: 2,
            left: 215,
            top: 50,
            vertical: 1,
            double: true,
            itemType: 'any',
          },
          { _code: 3, left: 310, top: 87, itemType: 'any' },
        ],
        portList: [
          {
            _code: 1,
            left: 30,
            top: 5,
            direct: { top: true, left: false },
            links: ['Zone[1].ZoneSide[1]'],
            t: 'any',
            s: 'core',
          },
          {
            _code: 2,
            left: 400,
            top: 5,
            direct: { top: false, right: true },
            // direct: { top: true, right: false },
            links: ['Zone[3].ZoneSide[2]'],
            t: 'any',
          },
          {
            _code: 3,
            left: 30,
            top: 170,
            //direct: { bottom: true, left: false },
            direct: { bottom: false, left: true },
            links: ['Zone[1].ZoneSide[1]'],
            t: 'any',
            s: 'core',
          },
          {
            _code: 4,
            left: 400,
            top: 170,
            direct: { bottom: true, right: false },
            links: ['Zone[3].ZoneSide[2]'],
            t: 'any',
            s: 'core',
          },
        ],
      });

      // deck.getObjectByCode('Dice[44]').moveToTarget(
      //   game.getObjectByCode('Plane[2]').getObjectByCode('Zone[1]')
      // );

      // deck
      //   .getObjectByCode('Dice[45]')
      //   .moveToTarget(game.getObjectByCode('Plane[1]Zone[4]'));

      // game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      // const dice1 = deck.getObjectByCode('Dice[11]');
      // dice1.moveToTarget( game.getObjectByCode('Plane[2]').getObjectByCode('Zone[1]') );
      // dice1.moveToTarget( deck );
      // //deck.getObjectByCode('Dice[22]').moveToTarget( game.getObjectByCode('Plane[3]').getObjectByCode('Zone[3]') );
      // console.log( game.getZonesAvailability( deck.getObjectByCode('Dice[22]') ) );

      game = new Game().fromJSON(JSON.parse(JSON.stringify(game)));

      const fakePlane = game.addPlane( playerPlanesHand.getObjectByCode('Plane[2]') );
      //console.log('updateDirect', fakePlane.getObjectByCode('Port[3]').updateDirect());
      // console.log('updateDirect', fakePlane.getObjectByCode('Port[3]').updateDirect());
      //fakePlane.getObjectByCode('Port[3]').updateDirect('bottom');
      // fakePlane.getObjectByCode('Port[3]').updateDirect();
      // fakePlane.getObjectByCode('Port[3]').updateDirect();

      //game.getObjectByCode('Plane[2]').getObjectByCode('Port[3]').updateDirect();

      /* game.linkPlanes({
        joinPort: fakePlane.getObjectByCode('Port[3]'),
        targetPort: game.getObjectByCode('Plane[3]').getObjectByCode('Port[1]'),
      }); */


      const availablePorts = [];
      fakePlane.getObjects({ className: 'Port' }).forEach( fakePort => {
        Object.keys(fakePort.direct).forEach( fakePortDirect =>{
          fakePort.updateDirect(fakePortDirect);
          //console.log('fakePort.direct', fakePortDirect);
          game.getObjects({ className: 'Plane', directParent: this }).forEach(plane => {
            plane.getObjects({ className: 'Port' }).forEach( port => {
              //console.log("linkedBridge=", port.code, port.linkedBridge);
              if(!port.linkedBridge) {
                Object.keys(port.direct).forEach( portDirect =>{
                  port.updateDirect(portDirect);
                  game.linkPlanes({ joinPort: fakePort, targetPort: port});
                  const checkPlaneCollysion = game.checkPlaneCollysion( fakePlane );
                  if(checkPlaneCollysion.collysionList.length === 0){
                    availablePorts.push({
                      portId: port._id, direct: portDirect, 
                      position: checkPlaneCollysion.planePosition,
                    })
                  }
                });
              }
            });
          });
        });
      });
      console.log("availablePorts=", availablePorts);

      //console.log("planeHasCollysions", game.planeHasCollysions( fakePlane ));
      // !!! delete fakePlane

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
