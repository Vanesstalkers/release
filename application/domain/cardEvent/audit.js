({
  init: function ({ game }) {
    game.set('activeEvent', { sourceId: this._id });
    for (const player of game.getObjects({ className: 'Player' })) {
      player.set('activeEvent', { sourceId: this._id });
    }
  },
  handlers: {
    eventTrigger: function ({ game, target }) {
      const hand = target.getObjectByCode('Deck[domino]');
      for(const dice of hand.getObjects({ className: 'Dice' })){
        dice.set('visible', true);
      }
      hand.set('itemMap', hand.itemMap); // инициирует рассылку изменений с пересчетом видимости

      game.set('activeEvent', null);
      for (const player of game.getObjects({ className: 'Player' })) {
        player.set('activeEvent', null);
      }
    },
  },
});
