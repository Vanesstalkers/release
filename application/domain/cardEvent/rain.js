({
  config: {
    autoPlay: true
  },
  init: function () {
    const game = this.getGame();
    game.activeEvent = {sourceId: this._id};
    game.getObjects({ className: 'Player' }).forEach(player => {
      player.activeEvent = {sourceId: this._id};
    });
  },
  handlers: {
    eventTrigger: function ({targetId}) {
      const game = this.getGame();
      const target = game.getObjectById(targetId);
      target.eventData.skipTurn = true;
      
      delete game.activeEvent;
      game.getObjects({ className: 'Player' }).forEach(player => {
        delete player.activeEvent;
      });
    },
  }
});
