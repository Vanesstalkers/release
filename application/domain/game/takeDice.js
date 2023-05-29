(game, { count }) => {
  const player = game.getActivePlayer();
  const playerHand = player.getObjectByCode('Deck[domino]');
  const deck = game.getObjectByCode('Deck[domino]');
  deck.moveRandomItems({ count, target: playerHand });
  return { status: 'ok' };
};
