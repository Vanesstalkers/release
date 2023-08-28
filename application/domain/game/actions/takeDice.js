(function ({ count }) {
  return;
  const player = this.getActivePlayer();
  const playerHand = player.getObjectByCode('Deck[domino]');
  const deck = this.getObjectByCode('Deck[domino]');
  deck.moveRandomItems({ count, target: playerHand });
});
