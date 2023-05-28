({
  init: async function ({ game, player }) {
    let diceFound = false;
    for (const deck of player.getObjects({ className: 'Deck' })) {
      if (deck.type !== 'domino') continue;
      for (const dice of deck.getObjects({ className: 'Dice' })) {
        for (const dside of dice.getObjects({ className: 'DiceSide' })) {
          dside.set('activeEvent', { sourceId: this._id });
          diceFound = true;
        }
      }
    }
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: async function ({ game, player, target, fakeValue = 0, skipFakeValueSet }) {
      if (fakeValue === undefined) return;
      if (!skipFakeValueSet) {
        if (!target) return;
        const realValue = target.eventData.fakeValue?.realValue ?? target.value;
        target.assign('eventData', { fakeValue: { realValue } });
        target.set('value', fakeValue);
      }

      for (const deck of player.getObjects({ className: 'Deck' })) {
        if (deck.type !== 'domino') continue;
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          for (const dside of dice.getObjects({ className: 'DiceSide' })) {
            dside.set('activeEvent', null);
          }
        }
      }
      game.set('activeEvent', null);

      return { timerOverdueOff: true };
    },
    endRound: async function ({ game }) {
      const restoredDices = {};
      for (const dside of game.getObjects({ className: 'DiceSide' })) {
        if (dside.eventData.fakeValue) {
          dside.set('value', dside.eventData.fakeValue.realValue);
          dside.delete('eventData', 'fakeValue');
          const zoneParent = dside.findParent({ className: 'Zone' });
          if (zoneParent) {
            zoneParent.updateValues();
            // не пишем в лог сообщение о костяшках в руке, чтобы соперники не узнали об их наличии
            const dice = dside.getParent();
            restoredDices[dice._id] = dice;
          }
        }
      }
      for (const dice of Object.values(restoredDices)) {
        const diceTitle = dice.sideList.map((side) => side.value).join('-');
        game.log(`Костяшка "${diceTitle}" восстановила свои значения, измененные событием "Костыль".`);
      }
    },
    timerOverdue: async function ({ game }) {
      await domain.cardEvent['crutch'].handlers.eventTrigger({
        game,
        player: game.getActivePlayer(),
        skipFakeValueSet: true,
      });
    },
  },
});
