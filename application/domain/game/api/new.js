async (context, { type, subtype }) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const { lobbyId } = session;

  const game = await new domain.game.class().create({ type, subtype });

  lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', { id: game.id(), type, subtype });

  return { status: 'ok', gameId: game.id() };
};
