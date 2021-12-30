({
  config: {
    autoPlay: true
  },
  init: function () {
    const game = this.getGame();
    const player = game.getActivePlayer();
    
    let diceFound = false;
    player.getObjects({ className: 'Deck' }).forEach(deck => {
      deck.getObjects({ className: 'Dice' }).forEach(dice => {
        dice.getObjects({ className: 'DiceSide' }).forEach(diceSide => {
          diceSide.activeEvent = {sourceId: this._id};
          diceFound = true;
        });
      });
    });
    if(diceFound) game.activeEvent = {sourceId: this._id};
  },
  handlers: {
    eventTrigger: function ({targetId, fakeValue = 0}) {

      if(fakeValue === undefined) return true;

      const game = this.getGame();
      const player = game.getActivePlayer();
      const target = game.getObjectById(targetId);
      
      if(!target) return true;

      if(!target.eventData.fakeValue){ // второй cardEvent.crutch подряд (не тестил)
        target.eventData = {fakeValue: {realValue: target.value}};
      }
      target.value = fakeValue;
      
      game.activeEvent = null;
      target.activeEvent = null;
      player.getObjects({ className: 'Deck' }).forEach(deck => {
        deck.getObjects({ className: 'Dice' }).forEach(dice => {
          dice.getObjects({ className: 'DiceSide' }).forEach(diceSide => {
            diceSide.activeEvent = null;
          });
        });
      });

      return true;
    },
    endRound: function () {
      const game = this.getGame();

      game.getObjects({ className: 'DiceSide' }).forEach(diceSide => {
        if(diceSide.eventData.fakeValue){
          diceSide.value = diceSide.eventData.fakeValue.realValue;
          delete diceSide.eventData.fakeValue;

          const zoneParent = diceSide.findParent({ className: 'Zone' });
          if(zoneParent) zoneParent.updateValues();
        }
      });

      return true;
    },
  }
});
