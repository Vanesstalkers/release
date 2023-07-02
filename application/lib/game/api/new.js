async (context, { type }) => {
  const game = await new domain.game.class().create({ type });
  return { status: 'ok', gameId: game.id() };
};
