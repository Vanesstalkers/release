async (context) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  session.unsubscribe(`lobby-${lobbyId}`);
  session.set({ lobbyId: null });
  await session.saveChanges();

  user.leaveLobby({ sessionId, lobbyId });

  return { status: 'ok' };
};
