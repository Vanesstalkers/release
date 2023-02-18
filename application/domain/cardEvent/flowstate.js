({
  init: function ({ game, player }) {
    const deck = game.getObjectByCode('Deck[domino]');

    const newPlayerHand = player.addDeck({
      type: 'domino',
      subtype: 'flowstate',
      itemType: 'any',
      settings: { itemsUsageLimit: 2, itemsStartCount: 3 },
    });
    deck.moveRandomItems({ count: newPlayerHand.settings.itemsStartCount, target: newPlayerHand });
  },
  handlers: {
    replaceDice: function ({ game, player }) {
      const deck = player.getObjectByCode('Deck[domino_flowstate]');
      const itemIds = Object.keys(deck.itemMap);

      if (itemIds.length > deck.settings.itemsStartCount - deck.settings.itemsUsageLimit) return { saveHandler: true };

      const gameDominoDeck = game.getObjectByCode('Deck[domino]');
      for (const itemId of itemIds) {
        game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
      }
      player.deleteDeck(deck);
    },
    endRound: function ({ game, player }) {
      const deck = player.getObjectByCode('Deck[domino_flowstate]');

      if (deck) {
        // deck еще не удален - не было сыграно достаточное количество dice
        const gameDominoDeck = game.getObjectByCode('Deck[domino]');
        for (const itemId of Object.keys(deck.itemMap)) {
          game.getStore().dice[itemId].moveToTarget(gameDominoDeck);
        }
        player.deleteDeck(deck);
      }
    },
  },
});
