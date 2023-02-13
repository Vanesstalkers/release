({
  config: {
    autoPlay: true,
  },
  init: function () {
    const game = this.getGame();
    const player = game.getActivePlayer();
    const deck = game.getObjectByCode('Deck[domino]');

    const newPlayerHand = player.addDeck({
      type: 'domino',
      subtype: 'teamlead',
      itemType: 'any',
      settings: {
        itemsUsageLimit: 1,
        itemsStartCount: 5,
      },
    });
    for (let i = 0; i < newPlayerHand.settings.itemsStartCount; i++) {
      const item = deck.getRandomItem();
      if (item) item.moveToTarget(newPlayerHand);
    }
  },
  handlers: {
    replaceDice: function () {
      const game = this.getGame();
      const player = game.getActivePlayer();
      const deck = player.getObjectByCode('Deck[domino_teamlead]');
      const itemIds = Object.keys(deck.itemMap);

      if (
        itemIds.length <=
        deck.settings.itemsStartCount - deck.settings.itemsUsageLimit
      ) {
        const gameDominoDeck = game.getObjectByCode('Deck[domino]');
        for (const itemId of itemIds) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
        return true;
      }
      return false; // если itemsUsageLimit станет больше 1, то handler не должен удаляться из game.eventHandlers
    },
    endRound: function () {
      const game = this.getGame();
      const player = game.getActivePlayer();
      const deck = player.getObjectByCode('Deck[domino_teamlead]');

      if (deck) {
        // deck еще не удален - не было сыграно достаточное количество dice
        const gameDominoDeck = game.getObjectByCode('Deck[domino]');
        for (const itemId of Object.keys(deck.itemMap)) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
      }
      return true;
    },
  },
});
