({
  config: {
    autoPlay: true,
  },
  init: function () {
    const game = this.getGame();
    const player = game.getActivePlayer();

    let diceFound = false;
    player.getObjects({ className: 'Deck' }).forEach((deck) => {
      deck.getObjects({ className: 'Dice' }).forEach((dice) => {
        dice.getObjects({ className: 'DiceSide' }).forEach((diceSide) => {
          diceSide.set('activeEvent', { sourceId: this._id });
          diceFound = true;
        });
      });
    });
    if (diceFound) game.set('activeEvent', { sourceId: this._id });
  },
  handlers: {
    eventTrigger: function ({ targetId, fakeValue = 0 }) {
      if (fakeValue === undefined) return true;

      const game = this.getGame();
      const player = game.getActivePlayer();
      const target = game.getObjectById(targetId);

      if (!target) return true;

      const realValue = target.eventData.fakeValue?.realValue ?? target.value;
      target.assign('eventData', { fakeValue: { realValue } });
      target.set('value', fakeValue);

      player.getObjects({ className: 'Deck' }).forEach((deck) => {
        deck.getObjects({ className: 'Dice' }).forEach((dice) => {
          dice.getObjects({ className: 'DiceSide' }).forEach((diceSide) => {
            diceSide.set('activeEvent', null);
          });
        });
      });
      game.set('activeEvent', null);

      return true;
    },
    endRound: function () {
      const game = this.getGame();
      game.getObjects({ className: 'DiceSide' }).forEach((diceSide) => {
        if (diceSide.eventData.fakeValue) {
          diceSide.set('value', diceSide.eventData.fakeValue.realValue);
          diceSide.delete('eventData', 'fakeValue');
          const zoneParent = diceSide.findParent({ className: 'Zone' });
          if (zoneParent) zoneParent.updateValues();
        }
      });
    },
  },
});
