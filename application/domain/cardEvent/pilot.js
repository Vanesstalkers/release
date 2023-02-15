({
  config: {
    playOneTime: true,
  },
  init: function () {
    const game = this.getGame();
    const player = game.getActivePlayer();
    const deck = player.getObjectByCode('Deck[plane]');
    deck.addItem({
      _code: 1005,
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
    deck.addItem({
      _code: 1006,
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
  },
  handlers: {
    addPlane: function () {
      const game = this.getGame();
      const gameDeck = game.getObjectByCode('Deck[plane]');
      const player = game.getActivePlayer();
      const deck = player.getObjectByCode('Deck[plane]');
      const itemIds = Object.keys(deck.itemMap);
      for (const itemId of itemIds) {
        game.getStore().plane[itemId].moveToTarget(gameDeck);
      }
      return true;
    },
  },
});
