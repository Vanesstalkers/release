({
  init: function ({ game, player: activePlayer }) {
    let diceFound = false;
    for (const plane of game.getObjects({ className: 'Plane' })) {
      for (const dice of plane.getObjects({ className: 'Dice' })) {
        dice.set('activeEvent', { sourceId: this._id });
        diceFound = true;
      }
    }
    for (const bridge of game.getObjects({ className: 'Bridge' })) {
      for (const dice of bridge.getObjects({ className: 'Dice' })) {
        dice.set('activeEvent', { sourceId: this._id });
        diceFound = true;
      }
    }
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: function ({ game, player: activePlayer, target: dice }) {
      if (!dice) return;

      const playerHand = activePlayer.getObjectByCode('Deck[domino]');
      dice.moveToTarget(playerHand);
      dice.set('visible', true);
      dice.set('locked', true);

      dice.set('activeEvent', null);
      game.set('activeEvent', null);
      for (const plane of game.getObjects({ className: 'Plane' })) {
        for (const dice of plane.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', null);
        }
      }
      for (const bridge of game.getObjects({ className: 'Bridge' })) {
        for (const dice of bridge.getObjects({ className: 'Dice' })) {
          dice.set('activeEvent', null);
        }
      }
    },
    endRound: function ({ game }) {
      for (const dice of game.getObjects({ className: 'Dice' })) {
        if (dice.locked) dice.set('locked', false);
      }
    },
  },
});
