async (context, { type }) => {
  const game = await new domain.game.class().create({ type });

  lib.store.broadcaster.publishAction(`lobby-main`, 'addGame', { id: game.id() });

  // // const activePlayer = game.getActivePlayer();
  // // const playerHand = activePlayer.getObjectByCode('Deck[card]');
  // // const cards = game.getObjects({ className: 'Card' });
  // // for (const card of cards.filter(card => card.name !== 'pilot')) {
  // //   card.moveToTarget(playerHand);
  // // }

  return { status: 'ok', gameId: game.id() };
};
