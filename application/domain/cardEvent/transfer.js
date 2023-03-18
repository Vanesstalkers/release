({
  init: async function ({ game, player }) {
    const playerHand = player.getObjectByCode('Deck[domino]');
    const gameDeck = game.getObjectByCode('Deck[domino]');

    const count = playerHand.itemsCount();
    playerHand.moveAllItems({ target: gameDeck });
    gameDeck.moveRandomItems({ count, target: playerHand });
  },
});
