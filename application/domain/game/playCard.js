async (game, { cardId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );
  const card = game.getObjectById(cardId);
  await card.play();
  const cardDeckDrop = game.getObjectByCode('Deck[card_active]');
  card.moveToTarget(cardDeckDrop);
  return { status: 'ok' };
};
