({
  single: {
    blitz: {
      timer: 60,
      timerReleasePremium: 20,
      planesAtStart: 2,
      planesNeedToStart: 2,
      roundStartCardAddToPlayerHand: true,
      allowedAutoCardPlayRoundStart: false,
    },
    standart: {
      timer: 45,
      timerReleasePremium: 15,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
    },
    hardcore: {
      timer: 30,
      timerReleasePremium: 10,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: true,
    },
    default: {
      singlePlayer: true,
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 3, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: ['audit', 'coffee', 'weekend'],
      autoFinishAfterRoundsOverdue: 10,

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
  },
  duel: {
    blitz: {
      timer: 60,
      timerReleasePremium: 20,
      playerHandStart: 0,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 2, // нужно для начала игры (будут добавляться игроками)
      roundStartCardAddToPlayerHand: true,
      allowedAutoCardPlayRoundStart: false,
    },
    standart: {
      timer: 45,
      timerReleasePremium: 15,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
    },
    hardcore: {
      timer: 30,
      timerReleasePremium: 10,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: true,
    },
    default: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 3,
      playerHandLimit: 3,
      planesAtStart: 1, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,

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
  },
  ffa: {
    blitz: {
      timer: 60,
      timerReleasePremium: 20,
      roundStartCardAddToPlayerHand: true,
      allowedAutoCardPlayRoundStart: false,
    },
    standart: {
      timer: 45,
      timerReleasePremium: 15,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
    },
    hardcore: {
      timer: 30,
      timerReleasePremium: 10,
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: true,
    },
    default: {
      timer: 60,
      timerReleasePremium: 15,
      playerHandStart: 2,
      playerHandLimit: 2,
      planesAtStart: 0, // изначальное количество блоков на поле
      planesNeedToStart: 3, // нужно для начала игры (будут добавляться игроками)
      planesToChoosee: 2, // блоков на выбор игроку для добавления на поле
      roundStartCardAddToPlayerHand: false,
      allowedAutoCardPlayRoundStart: false,
      cardsToRemove: [],
      autoFinishAfterRoundsOverdue: 10,

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
  },
});
