({
  init: function ({ game, player }) {
    const deck = game.getObjectByCode('Deck[domino]');
    for (const bridge of game.getObjects({ className: 'Bridge' })) {
      for (const dice of bridge.getObjects({ className: 'Dice' })) {
        dice.moveToTarget(deck);
      }
    }
  },
});
