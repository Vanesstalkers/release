({
  init: function ({ game, player }) {
    let diceFound = false;
    const deck = player.getObjectByCode('Deck[domino]');
    for (const dice of deck.getObjects({ className: 'Dice' })) {
      dice.set('activeEvent', { sourceId: this._id });
      diceFound = true;
    }
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: function ({ game, player: activePlayer, target }) {
      if (!target) return;

      function complete({ game, dice }) {
        game.set('activeEvent', null);
        dice.set('activeEvent', null);
        for (const player of game.getObjects({ className: 'Player' })) {
          if (player === activePlayer) continue;
          player.set('activeEvent', null);
        }
        return { timerOverdueOff: true };
      }

      if (!game.activeEvent.targetDiceId) {
        const deck = activePlayer.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', null);
        }

        game.set({ activeEvent: { targetDiceId: target._id } });
        for (const player of game.getObjects({ className: 'Player' })) {
          if (player === activePlayer) continue;
          player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
        }

        if (game.isSinglePlayer()) {
          target.moveToTarget(game.getObjectByCode('Deck[domino]'));
          return complete({ game, dice: target });
        } else {
          const players = game.getObjects({ className: 'Player' });
          if (players.length === 2) {
            domain.cardEvent['give_project'].handlers.eventTrigger.call(this, {
              game,
              player: activePlayer,
              target: players.find((p) => p !== activePlayer),
            });
          } else {
            return { saveHandler: true };
          }
        }
      } else {
        const dice = game.getObjectById(game.activeEvent.targetDiceId);
        const targetDeck = target.getObjectByCode('Deck[domino]');
        if (target.matches({ className: 'Player' })) {
          game.log({
            msg: `Игрок {{player}} стал целью события "${this.title}".`,
            userId: target.userId,
          });
        }
        dice.moveToTarget(targetDeck);
        return complete({ game, dice });
      }
    },
    timerOverdue: function ({ game }) {
      const player = game.getActivePlayer();
      if (!game.activeEvent?.targetDiceId) {
        const targetDice = player.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' })[0];
        if (targetDice) game.set({ activeEvent: { targetDiceId: targetDice._id } });
        const deck = player.getObjectByCode('Deck[domino]');
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', null);
        }
      }
      if (game.activeEvent?.targetDiceId) {
        const target = game.isSinglePlayer()
          ? game
          : game.getObjects({ className: 'Player' }).find((p) => p !== player);
        domain.cardEvent['give_project'].handlers.eventTrigger.call(this, { game, player, target });
      }
    },
  },
});
