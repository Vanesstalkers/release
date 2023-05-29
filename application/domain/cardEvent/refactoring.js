({
  init: async function ({ game, player: activePlayer }) {
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
    else return { removeHandlers: true };
  },
  handlers: {
    eventTrigger: async function ({ game, player: activePlayer, target: dice }) {
      if (!dice) return { timerOverdueOff: true };

      const parent = dice.findParent({ className: 'Zone' }).getParent(); // тут моет быть Bridge
      parent.set('release', null);
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

      game.log({
        msg: `Игрок {{player}} забрал со стола костяшку "${dice.getTitle()}".`,
        userId: activePlayer.userId,
      });

      return { timerOverdueOff: true };
    },
    endRound: async function ({ game }) {
      for (const dice of game.getObjects({ className: 'Dice' })) {
        if (dice.locked) dice.set('locked', null);
      }
    },
    timerOverdue: async function ({ game }) {
      async function eventTrigger(dice) {
        const player = game.getActivePlayer();
        await domain.cardEvent['refactoring'].handlers.eventTrigger.call(this, { game, player, target: dice });
      }

      for (const plane of game.getObjects({ className: 'Plane' })) {
        for (const dice of plane.getObjects({ className: 'Dice' })) {
          return await eventTrigger(dice);
        }
      }
      for (const bridge of game.getObjects({ className: 'Bridge' })) {
        for (const dice of bridge.getObjects({ className: 'Dice' })) {
          return await eventTrigger(dice);
        }
      }
      await eventTrigger();
    },
  },
});
