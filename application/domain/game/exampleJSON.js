({
  'single-blitz': {
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 3, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      allowedAutoCardPlayRoundStart: false,
      singlePlayer: true,
      cardsToRemove: ['audit', 'coffee', 'weekend'],
      autoFinishAfterRoundsOverdue: 10,
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
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 1, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,
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
    settings: {
      timer: 30,
      timerReleasePremium: 10,
      playerHandStart: 2,
      playerHandLimit: 2,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,
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
