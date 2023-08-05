async (context) => {
  const { sessionId } = context;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  session.unsubscribe(`lobby-main`);
  user.leaveLobby({ sessionId });

  return { status: 'ok' };
};
