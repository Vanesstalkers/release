async (context, { type }) => {
  const game = await new domain.game.class().create({ type });

  lib.store.broadcaster.publishAction(`lobby-main`, 'addGame', { id: game.id() });

  return { status: 'ok', gameId: game.id() };
};
