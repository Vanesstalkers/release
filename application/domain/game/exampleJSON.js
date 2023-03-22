({
  'single-blitz': {
    addTime: Date.now(),
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 3, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      acceptAutoPlayRoundStartCard: true,
      singlePlayer: true,
      cardsToRemove: ['audit', 'coffee', 'weekend'],
    },
    playerList: [
      {
        _code: 1,
        active: true,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
    ],
    deckList: [
      { type: 'plane' },
      { type: 'domino', itemType: 'any' },
      { type: 'card', itemType: 'event' },
      { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
      { type: 'card', subtype: 'drop', itemType: 'event' },
    ],
  },
  'duel-blitz': {
    addTime: Date.now(),
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 1, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      acceptAutoPlayRoundStartCard: false,
      cardsToRemove: [],
    },
    playerList: [
      {
        _code: 1,
        active: true,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
      {
        _code: 2,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
    ],
    deckList: [
      { type: 'plane' },
      { type: 'domino', itemType: 'any' },
      { type: 'card', itemType: 'event' },
      { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
      { type: 'card', subtype: 'drop', itemType: 'event' },
    ],
  },
  'ffa-blitz': {
    addTime: Date.now(),
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 2,
      playerHandLimit: 2,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      acceptAutoPlayRoundStartCard: false,
      cardsToRemove: [],
    },
    playerList: [
      {
        _code: 1,
        active: true,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
      {
        _code: 2,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
      {
        _code: 3,
        deckList: [{ type: 'domino', itemType: 'any' }, { type: 'card', itemType: 'event' }, { type: 'plane' }],
      },
    ],
    deckList: [
      { type: 'plane' },
      { type: 'domino', itemType: 'any' },
      { type: 'card', itemType: 'event' },
      { type: 'card', subtype: 'active', itemType: 'event', access: 'all' },
      { type: 'card', subtype: 'drop', itemType: 'event' },
    ],
  },
});
