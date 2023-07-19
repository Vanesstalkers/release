({
  init: function ({ game, player: activePlayer }) {
    if (game.isSinglePlayer()) {
      const deck = game.getObjectByCode('Deck[domino]');
      const hand = activePlayer.getObjectByCode('Deck[domino]');
      deck.moveRandomItems({ count: 1, target: hand });
      return { removeHandlers: true };
    } else {
      let diceFound = false;
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: { sourceId: this._id } });
          diceFound = true;
        }
        player.set({ activeEvent: { showDecks: true, sourceId: this._id } });
      }
      if (diceFound) game.set({ activeEvent: { sourceId: this._id } });
    }
  },
  handlers: {
    eventTrigger: function ({ game, player: activePlayer, targetId: fakeId, targetPlayerId }) {
      if (!fakeId || !targetPlayerId) return;
      const targetPlayer = game.getObjectById(targetPlayerId);
      if (!targetPlayer) return;
      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      const handId = targetPlayerHand.id();
      const dice = targetPlayerHand
        .getObjects({ className: 'Dice' })
        .find((dice) => dice.fakeId[handId] === fakeId || dice.id() === fakeId);
      if (!dice) return;

      const playerHand = activePlayer.getObjectByCode('Deck[domino]');
      dice.moveToTarget(playerHand);

      dice.set({ activeEvent: null });
      game.set({ activeEvent: null });
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: null });
        }
        player.set({ activeEvent: null });
      }

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.title}".`,
        userId: targetPlayer.userId,
      });

      return { timerOverdueOff: true };
    },
    timerOverdue: function ({ game }) {
      const activePlayer = game.getActivePlayer();

      for (const player of game.getObjects({ className: 'Player' }).filter((p) => p !== activePlayer)) {
        const playerId = player.id();
        const dice = player.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' })[0];
        if (dice) {
          domain.cardEvent['take_project'].handlers.eventTrigger.call(this, {
            game,
            player: activePlayer,
            targetId: dice.fakeId[playerId],
            targetPlayerId: playerId,
          });
        }
      }
    },
  },
});
