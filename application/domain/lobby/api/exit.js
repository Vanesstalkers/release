async (context) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  session.unsubscribe(`lobby-${lobbyId}`);
  user.leaveLobby({ sessionId, lobbyId });

  return { status: 'ok' };
};
