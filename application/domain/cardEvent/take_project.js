({
  init: function ({ game, player: activePlayer }) {
    if (game.isSinglePlayer()) {
      const deck = game.getObjectByCode('Deck[domino]');
      const hand = activePlayer.getObjectByCode('Deck[domino]');
      deck.moveRandomItems({ count: 1, target: hand });
    } else {
      let diceFound = false;
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', { sourceId: this._id });
          diceFound = true;
        }
        player.set('activeEvent', { showDecks: true, sourceId: this._id });
      }
      if (diceFound) game.set('activeEvent', { sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: function ({ game, player: activePlayer, targetId: fakeId, targetPlayerId }) {
      if (!fakeId || !targetPlayerId) return;
      const targetPlayer = game.getObjectById(targetPlayerId);
      if (!targetPlayer) return;
      const targetPlayerHand = targetPlayer.getObjectByCode('Deck[domino]');
      const dice = targetPlayerHand
        .getObjects({ className: 'Dice' })
        .find((dice) => dice.fakeId === fakeId || dice._id.toString() === fakeId);
      if (!dice) return;

      const playerHand = activePlayer.getObjectByCode('Deck[domino]');
      dice.moveToTarget(playerHand);

      dice.set('activeEvent', null);
      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        if (player === activePlayer) continue;
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', null);
        }
        player.set('activeEvent', null);
      }
    },
  },
});
