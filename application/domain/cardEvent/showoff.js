({
  init: function ({ game, player }) {
    const deck = game.getObjectByCode('Deck[domino]');
    const hand = player.getObjectByCode('Deck[domino]');
    const count = hand.itemsCount();
    deck.moveRandomItems({ count: game.settings.playerHandLimit - count, target: hand });
  },
});
