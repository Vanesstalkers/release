async (context, { type, subtype }) => {
  const game = await new domain.game.class().create({ type, subtype });
  return { status: 'ok', gameId: game.id() };
};
