({
  init: function ({ game, player: activePlayer }) {
    let diceFound = false;
    for (const plane of game.getObjects({ className: 'Plane' })) {
      for (const dice of plane.getObjects({ className: 'Dice' })) {
        dice.set({ activeEvent: { sourceId: this._id } });
        diceFound = true;
      }
    }
    for (const bridge of game.getObjects({ className: 'Bridge' })) {
      for (const dice of bridge.getObjects({ className: 'Dice' })) {
        dice.set({ activeEvent: { sourceId: this._id } });
        diceFound = true;
      }
    }
    if (diceFound) game.set({ activeEvent: { sourceId: this._id } });
    else return { removeHandlers: true };
  },
  handlers: {
    eventTrigger: function ({ game, player: activePlayer, target: dice }) {
      if (!dice) return { timerOverdueOff: true };

      const parent = dice.findParent({ className: 'Zone' }).getParent(); // тут моет быть Bridge
      parent.set({ release: null });
      const playerHand = activePlayer.getObjectByCode('Deck[domino]');
      dice.moveToTarget(playerHand);
      dice.set({
        visible: true,
        locked: true,
        activeEvent: null,
      });
      game.set({ activeEvent: null });
      for (const plane of game.getObjects({ className: 'Plane' })) {
        for (const dice of plane.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: null });
        }
      }
      for (const bridge of game.getObjects({ className: 'Bridge' })) {
        for (const dice of bridge.getObjects({ className: 'Dice' })) {
          dice.set({ activeEvent: null });
        }
      }

      game.logs({
        msg: `Игрок {{player}} забрал со стола костяшку "${dice.getTitle()}".`,
        userId: activePlayer.userId,
      });

      return { timerOverdueOff: true };
    },
    endRound: function ({ game }) {
      for (const dice of game.getObjects({ className: 'Dice' })) {
        if (dice.locked) dice.set({ locked: null });
      }
    },
    timerOverdue: function ({ game }) {
      function eventTrigger(dice) {
        const player = game.getActivePlayer();
        domain.cardEvent['refactoring'].handlers.eventTrigger.call(this, { game, player, target: dice });
      }

      for (const plane of game.getObjects({ className: 'Plane' })) {
        for (const dice of plane.getObjects({ className: 'Dice' })) {
          return eventTrigger(dice);
        }
      }
      for (const bridge of game.getObjects({ className: 'Bridge' })) {
        for (const dice of bridge.getObjects({ className: 'Dice' })) {
          return eventTrigger(dice);
        }
      }
      eventTrigger();
    },
  },
});
