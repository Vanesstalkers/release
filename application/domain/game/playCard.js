(game, { cardId }) => {
  if (game.activeEvent)
    throw new Error(
      game.activeEvent.errorMsg || 'Игрок не может совершить это действие, пока не завершит активное событие.'
    );
  const card = game.getObjectById(cardId);
  card.play();
  const cardDeckDrop = game.getObjectByCode('Deck[card_active]');
  card.moveToTarget(cardDeckDrop);

  game.log(`Пользователь {{player}} активировал событие "${card.title}".`);

  return { status: 'ok' };
};
