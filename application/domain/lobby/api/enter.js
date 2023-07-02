async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);
  session.subscribe(`lobby-main`);

  user.joinLobby({ sessionId });
  // lib.store.broadcaster.publishAction(`user-${userId}`, 'joinLobby', { sessionId });

  context.client.events.close.push(() => {
    // lib.store.broadcaster.publishAction(`user-${userId}`, 'leaveLobby', { sessionId });
    user.leaveLobby({ sessionId });
  });

  return { status: 'ok' };
};
