({
  init: async function ({ game, player }) {
    let diceFound = false;
    const deck = player.getObjectByCode('Deck[domino]');
    for (const dice of deck.getObjects({ className: 'Dice' })) {
      dice.set('activeEvent', { sourceId: this._id });
      diceFound = true;
    }
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: async function ({ game, player: activePlayer, target }) {
      if (!target) return;

      async function complete({ game, dice }) {
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

        game.assign('activeEvent', { targetDiceId: target._id });
        for (const player of game.getObjects({ className: 'Player' })) {
          if (player === activePlayer) continue;
          player.set('activeEvent', { choiceEnabled: true, sourceId: this._id });
        }

        if (game.isSinglePlayer()) {
          target.moveToTarget(game.getObjectByCode('Deck[domino]'));
          return await complete({ game, dice: target });
        } else {
          return { saveHandler: true };
        }
      } else {
        const playerHand = target.getObjectByCode('Deck[domino]');
        const dice = game.getObjectById(game.activeEvent.targetDiceId);
        dice.moveToTarget(playerHand);
        return await complete({ game, dice });
      }
    },
    timerOverdue: async function ({ game }) {
      const player = game.getActivePlayer();
      if (!game.activeEvent?.targetDiceId) {
        const targetDice = player.getObjectByCode('Deck[domino]').getObjects({ className: 'Dice' })[0];
        if (targetDice) {
          await domain.cardEvent['give_project'].handlers.eventTrigger({ game, player, target: targetDice });
        }
        if (game.isSinglePlayer()) return;
      }
      if (game.activeEvent.targetDiceId) {
        await domain.cardEvent['give_project'].handlers.eventTrigger({
          game,
          player,
          target: game.getObjects({ className: 'Player' }).find((p) => p !== player),
        });
      }
    },
  },
});
