async (game, { cardId }) => {
  const card = game.getObjectById(cardId);
  card.play();
  const cardDeckDrop = game.getObjectByCode('Deck[card_drop]');
  card.moveToTarget(cardDeckDrop);
  return { status: 'ok' };
};
