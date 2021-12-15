({
  addTime: Date.now(),
  settings: {
    type: 'duel',
    playerHandStart: 3,
    playerHandLimit: 3,
    planesNeedToStart: 3,
  },
  round: 1,
  playerList: [
    {
      _code: 1,
      active: true,
      deckList: [{ type: 'domino', itemType: 'any' }],
      planeList: [
        {
          _code: 11,
          zoneList: [
            { _code: 666, left: 130, top: 7, itemType: 'any', s: 'bash' },
          ],
        },
      ],
    },
    {
      _code: 2,
      deckList: [{ type: 'domino', itemType: 'any' }],
    },
  ],
  deckList: [
    {
      type: 'domino',
      itemType: 'any',
      itemList: [
        [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
        [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
        [3, 3], [3, 4], [3, 5], [3, 6],
        [4, 4], [4, 5], [4, 6],
        [5, 5], [5, 6],
        [6, 6],
      ],
    },
    {
      type: 'card',
      itemType: 'event',
      itemList: [
        // {name: 'pilot', playOneTime: true},
        // {name: 'req_tax', playOneTime: true},
        // {name: 'req_legal', playOneTime: true},
        { name: 'teamlead', autoPlay: false },
        { name: 'flowstate', autoPlay: false },
        { name: 'teamlead', autoPlay: false },
        { name: 'flowstate', autoPlay: false },
        { name: 'teamlead', autoPlay: false },
        { name: 'flowstate', autoPlay: false },
        { name: 'teamlead', autoPlay: false },
        { name: 'flowstate', autoPlay: false },
        // {name: 'crutch', autoPlay: false},
        // {name: 'crutch', autoPlay: false},
        // {name: 'crutch', autoPlay: false},
        // {name: 'coffee'},
        // {name: 'weekend'},
        // {name: 'rain'},
        // {name: 'disease'},
      ],
    },
  ],
  planeList: [
    {
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
    },
    {
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
          links: ['Zone[3].ZoneSide[2]'],
          t: 'any',
        },
        {
          _code: 3,
          left: 30,
          top: 170,
          direct: { bottom: true, left: false },
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
    },
    {
      _code: 3,
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
          left: 30,
          top: 70,
          direct: { left: true },
          links: ['Zone[1].ZoneSide[1]'],
          t: 'any',
        },
        {
          _code: 2,
          left: 215,
          top: 20,
          direct: { top: true },
          links: ['Zone[2].ZoneSide[1]'],
          t: 'any',
        },
        {
          _code: 3,
          left: 430,
          top: 70,
          direct: { right: true },
          links: ['Zone[3].ZoneSide[2]'],
          t: 'any',
        },
      ],
    },
  ],
});
