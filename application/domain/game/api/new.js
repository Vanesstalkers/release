async (context, { type, subtype }) => {
  const game = await new domain.game.class().create({ type, subtype });

  lib.store.broadcaster.publishAction(`lobby-main`, 'addGame', { id: game.id(), type, subtype });

  return { status: 'ok', gameId: game.id() };
};
