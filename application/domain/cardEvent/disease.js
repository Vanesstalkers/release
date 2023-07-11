({
  init: function ({ game, player }) {
    if (game.isSinglePlayer()) {
      player.set({ eventData: { skipTurn: true } });
      return { removeHandlers: true };
    } else {
      game.set({ activeEvent: { sourceId: this._id } });
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set({ activeEvent: { choiceEnabled: true, sourceId: this._id } });
      }
    }
  },
  handlers: {
    eventTrigger: function ({ game, target: targetPlayer }) {
      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.title}".`,
        userId: targetPlayer.userId,
      });

      targetPlayer.set({ eventData: { skipTurn: true } });
      game.set({ activeEvent: null });
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set({ activeEvent: null });
      }
      return { timerOverdueOff: true };
    },
    timerOverdue: function ({ game }) {
      const player = game.getActivePlayer();
      const target = game.isSinglePlayer()
        ? player
        : game.getObjects({ className: 'Player' }).find((p) => p !== player);
      domain.cardEvent['disease'].handlers.eventTrigger.call(this, { game, target });
    },
  },
});
