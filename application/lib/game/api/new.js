async (context, { deckType, gameType, gameConfig, gameTimer }) => {
  const game = await new domain.game.class().create({ deckType, gameType });
  return { status: 'ok', gameId: game.id() };
};
