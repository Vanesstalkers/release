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
        
        return { saveHandler: true };
      } else {
        const playerHand = target.getObjectByCode('Deck[domino]');
        const dice = game.getObjectById(game.activeEvent.targetDiceId);
        dice.moveToTarget(playerHand);

        game.set('activeEvent', null);
        dice.set('activeEvent', null);
        for (const player of game.getObjects({ className: 'Player' })) {
          if (player === activePlayer) continue;
          player.set('activeEvent', null);
        }
      }
    },
  },
});
