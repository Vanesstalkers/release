({
  init: function ({ game }) {
    game.set('activeEvent', { sourceId: this._id });
    for (const player of game.getObjects({ className: 'Player' })) {
      player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: function ({ game, target }) {
      target.assign('eventData', { skipTurn: true });
      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }
    },
  },
});
