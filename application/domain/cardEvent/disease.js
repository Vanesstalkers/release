({
  init: async function ({ game, player }) {
    if (game.isSinglePlayer()) {
      player.assign('eventData', { skipTurn: true });
      return { removeHandlers: true };
    } else {
      game.set('activeEvent', { sourceId: this._id });
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
      }
    }
  },
  handlers: {
    eventTrigger: async function ({ game, target }) {
      console.log("eventTrigger: async function ({ game, target }) {");
      target.assign('eventData', { skipTurn: true });
      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        console.log("player.set('activeEvent', null);");
        player.set('activeEvent', null);
      }
      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      console.log('timerOverdue: async function ({ game }) {');
      const player = game.getActivePlayer();
      await domain.cardEvent['disease'].handlers.eventTrigger({
        game,
        target: game.getObjects({ className: 'Player' }).find((p) => p !== player),
      });
    },
  },
});
