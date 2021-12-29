({
  config: {
    autoPlay: true
  },
  handlers: {
    endRound: function () {
      const game = this.getGame();
      const player = game.getActivePlayer();
      player.eventData.extraTurn = true;
    },
  }
});
