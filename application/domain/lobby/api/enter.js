async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);

  const lobbyName = `lobby-main`;
  session.subscribe(lobbyName);
  context.client.events.close.unshift(() => {
    session.unsubscribe(lobbyName);
    user.leaveLobby({ sessionId });
  });
  await user.enterLobby({ sessionId });

  return { status: 'ok' };
};
