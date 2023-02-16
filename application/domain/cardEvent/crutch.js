({
  init: function ({ game, player }) {
    let diceFound = false;
    const deck = player.getObjectByCode('Deck[domino]');
    for (const dice of deck.getObjects({ className: 'Dice' })) {
      for (const dside of dice.getObjects({ className: 'DiceSide' })) {
        dside.set('activeEvent', { sourceId: this._id });
        diceFound = true;
      }
    }
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: function ({ game, player, target, fakeValue = 0 }) {
      if (fakeValue === undefined) return true;
      if (!target) return true;

      const realValue = target.eventData.fakeValue?.realValue ?? target.value;
      target.assign('eventData', { fakeValue: { realValue } });
      target.set('value', fakeValue);

      const deck = player.getObjectByCode('Deck[domino]');
      for (const dice of deck.getObjects({ className: 'Dice' })) {
        for (const dside of dice.getObjects({ className: 'DiceSide' })) {
          dside.set('activeEvent', null);
        }
      }
      game.set('activeEvent', null);

      return true;
    },
    endRound: function ({ game }) {
      for (const dside of game.getObjects({ className: 'DiceSide' })) {
        if (dside.eventData.fakeValue) {
          dside.set('value', dside.eventData.fakeValue.realValue);
          dside.delete('eventData', 'fakeValue');
          const zoneParent = dside.findParent({ className: 'Zone' });
          if (zoneParent) zoneParent.updateValues();
        }
      }
    },
  },
});
