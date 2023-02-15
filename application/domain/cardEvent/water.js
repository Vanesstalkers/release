({
  config: {
    autoPlay: true,
  },
  init: function () {
    const game = this.getGame();
    game.set('activeEvent', { sourceId: this._id });
    for (const player of game.getObjects({ className: 'Player' })) {
      player.set('activeEvent', { sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: function ({ targetId }) {
      const game = this.getGame();
      const target = game.getObjectById(targetId);
      target.assign('eventData', { skipTurn: true });
      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }
    },
  },
});
