async (context) => {
  const { sessionId, userId } = context;
  const session = lib.store('session').get(sessionId);
  const user = lib.store('user').get(userId);

  await user.enterLobby({ sessionId });

  session.subscribe(`lobby-main`);
  context.client.events.close.push(() => {
    user.leaveLobby({ sessionId });
  });

  return { status: 'ok' };
};
