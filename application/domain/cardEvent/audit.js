({
  init: async function ({ game }) {
    game.set('activeEvent', { sourceId: this._id });
    for (const player of game.getObjects({ className: 'Player' })) {
      player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: async function ({ game, target: targetPlayer }) {
      game.log({
        msg: `Игрок {{player}} стал целью события "${this.title}".`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      for (const dice of targetPlayerHand.getObjects({ className: 'Dice' })) {
        dice.set('visible', true);
        game.markNew(dice); // у других игроков в хранилище нет данных об этом dice
      }
      targetPlayerHand.set('itemMap', targetPlayerHand.itemMap); // инициирует рассылку изменений с пересчетом видимости

      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }

      return { timerOverdueOff: true };
    },
    timerOverdue: async function ({ game }) {
      const player = game.getActivePlayer();
      await domain.cardEvent['audit'].handlers.eventTrigger({
        game,
        target: game.getObjects({ className: 'Player' }).find((p) => p !== player),
      });
    },
  },
});
