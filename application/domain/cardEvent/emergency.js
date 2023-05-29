({
  init: function ({ game, player }) {
    const deck = game.getObjectByCode('Deck[domino]');
    for (const player of game.getObjects({ className: 'Player' })) {
      const hand = player.getObjectByCode('Deck[domino]');
      const count = hand.itemsCount();
      deck.moveRandomItems({ count: game.settings.playerHandLimit - count, target: hand });
    }
  },
});
