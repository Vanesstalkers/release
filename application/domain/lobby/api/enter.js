async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  session.subscribe(`lobby-main`);
  lib.store.broadcaster.publishAction(`user-${userId}`, 'joinLobby', { sessionId });

  context.client.events.close.push(() => {
    lib.store.broadcaster.publishAction(`user-${userId}`, 'leaveLobby', { sessionId });
  });

  return { status: 'ok' };
};
