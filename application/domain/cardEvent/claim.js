({
  init: async function ({ game, player }) {
    if (game.isSinglePlayer()) {
      const target = game.getActivePlayer();
      await domain.cardEvent['claim'].handlers.eventTrigger({ game, target });
      return { removeHandlers: true };
    } else {
      game.set('activeEvent', { sourceId: this._id });
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
      }
    }
  },
  handlers: {
    eventTrigger: async function ({ game, target: targetPlayer }) {
      game.log({
        msg: `Игрок {{player}} стал целью события "${this.title}".`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      const gameDeck = game.getObjectByCode('Deck[domino]');

      targetPlayerHand.moveAllItems({ target: gameDeck });

      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }

      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      const player = game.getActivePlayer();
      await domain.cardEvent['claim'].handlers.eventTrigger({
        game,
        target: game.getObjects({ className: 'Player' }).find((p) => p !== player),
      });
    },
  },
});
