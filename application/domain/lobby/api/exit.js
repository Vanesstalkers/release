async () => {
  const { userId } = context;
  const user = lib.store('user').get(userId);

  user.leaveLobby({ sessionId });

  return { status: 'ok' };
};
