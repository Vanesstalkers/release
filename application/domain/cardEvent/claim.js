({
  init: function ({ game }) {
    game.set('activeEvent', { sourceId: this._id });
    for (const player of game.getObjects({ className: 'Player' })) {
      player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: function ({ game, target: targetPlayer }) {
      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      const gameDeck = game.getObjectByCode('Deck[domino]');

      targetPlayerHand.moveAllItems({ target: gameDeck });

      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }
    },
  },
});
