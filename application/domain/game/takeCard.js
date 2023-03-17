async (game, { count }) => {
  const player = game.getActivePlayer();
  const playerHand = player.getObjectByCode('Deck[card]');
  const deck = game.getObjectByCode('Deck[card]');
  deck.moveRandomItems({ count, target: playerHand });
  return { status: 'ok' };
};
