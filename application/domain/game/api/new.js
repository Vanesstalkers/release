async (context, { type, subtype }) => {
  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { lobbyId } = session;
  const { tgUsername } = session.user();

  if (!lobbyId) throw new Error('lobby not found'); // этой ошибки быть не должно - оставил проверку для отладки

  const game = await new domain.game.class().create({ type, subtype });

  lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
    creator: { tgUsername, userId },
    id: game.id(),
    type,
    subtype,
  });

  return { status: 'ok', gameId: game.id() };
};
