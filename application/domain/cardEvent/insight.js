({
  init: function ({ game, player }) {
    const deck = game.getObjectByCode('Deck[domino]');
    const hand = player.getObjectByCode('Deck[domino]');
    deck.moveRandomItems({ count: 1, target: hand });
  },
});
