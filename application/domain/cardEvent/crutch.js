({
  init: function ({ game, player }) {
    let diceFound = false;
    for (const deck of player.getObjects({ className: 'Deck' })) {
      if (deck.type !== 'domino') continue;
      for (const dice of deck.getObjects({ className: 'Dice' })) {
        for (const dside of dice.getObjects({ className: 'DiceSide' })) {
          dside.set({ activeEvent: { sourceId: this._id } });
          diceFound = true;
        }
      }
    }
    if (diceFound) game.set({ activeEvent: { sourceId: this._id } });
  },
  handlers: {
    eventTrigger: function ({ game, player, target, fakeValue = 0, skipFakeValueSet }) {
      if (fakeValue === undefined) return;
      if (!skipFakeValueSet) {
        if (!target) return;
        const realValue = target.eventData.fakeValue?.realValue ?? target.value;
        target.set({ eventData: { fakeValue: { realValue } }, value: fakeValue });
      }

      for (const deck of player.getObjects({ className: 'Deck' })) {
        if (deck.type !== 'domino') continue;
        for (const dice of deck.getObjects({ className: 'Dice' })) {
          for (const dside of dice.getObjects({ className: 'DiceSide' })) {
            dside.set({ activeEvent: null });
          }
        }
      }
      game.set({ activeEvent: null });

      return { timerOverdueOff: true };
    },
    endRound: function ({ game }) {
      const restoredDices = {};
      for (const dside of game.getObjects({ className: 'DiceSide' })) {
        if (dside.eventData.fakeValue) {
          dside.set({
            value: dside.eventData.fakeValue.realValue,
            eventData: { fakeValue: null },
          });
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
        game.logs(`Костяшка "${dice.getTitle()}" восстановила свои значения, измененные событием "Костыль".`);
      }
    },
    timerOverdue: function ({ game }) {
      domain.cardEvent['crutch'].handlers.eventTrigger.call(this, {
        game,
        player: game.getActivePlayer(),
        skipFakeValueSet: true,
      });
    },
  },
});
