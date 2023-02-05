({
  access: 'public',
  method: async () => {
    async function newGame() {
      const Game = domain.game.class();
      const game = new Game().fromJSON(domain.game.exampleJSON);

      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[1]').getObjectByCode('Port[1]'),
        targetPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[2]'),
      });
      game.linkPlanes({
        joinPort: game.getObjectByCode('Plane[3]').getObjectByCode('Port[2]'),
        targetPort: game.getObjectByCode('Plane[2]').getObjectByCode('Port[4]'),
      });

      game
        .getObjectByCode('Player[1]')
        .getObjectByCode('Deck[plane]')
        .addItem({
          _code: 4,
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
      game
        .getObjectByCode('Player[1]')
        .getObjectByCode('Deck[plane]')
        .addItem({
          _code: 5,
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

        game
        .getObjectByCode('Player[1]')
        .getObjectByCode('Deck[plane]')
        .addItem({
          _code: 6,
          zoneLinks: {
            'Zone[2]': {
              'ZoneSide[1]': [],
              'ZoneSide[2]': ['Zone[1].ZoneSide[2]', 'Zone[3].ZoneSide[1]'],
            },
          },
          zoneList: [
            { _code: 1, left: 50, top: 170, itemType: 'any', s: 'css' },
            {
              _code: 2,
              left: 215,
              top: 100,
              vertical: 1,
              itemType: 'any',
              s: 'html',
            },
            { _code: 3, left: 310, top: 170, itemType: 'any', s: 'js' },
          ],
          portList: [
            {
              _code: 1,
              left: 25,
              top: 70,
              direct: { left: true },
              links: ['Zone[1].ZoneSide[1]'],
              t: 'any',
            },
            {
              _code: 2,
              left: 215,
              top: 5,
              direct: { top: true },
              links: ['Zone[2].ZoneSide[1]'],
              t: 'any',
            },
            {
              _code: 3,
              left: 400,
              top: 70,
              direct: { right: true },
              links: ['Zone[3].ZoneSide[2]'],
              t: 'any',
            },
          ],
        });

      const insertOne = await db.mongo.insertOne('game', game);
      game._id = insertOne._id;

      return { result: 'success', gameId: game._id };
    }

    const { gameId } = await newGame();
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

    return { result: 'success', gameId };
  },
});
